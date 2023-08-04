import { Component, HostListener, OnInit } from '@angular/core';
import axios from 'axios';

@Component({
  selector: 'app-poke-search',
  templateUrl: './poke-search.component.html',
  styleUrls: ['./poke-search.component.css'],
})
export class PokeSearchComponent implements OnInit {
  pokeSearchString: string = '';
  allPokemon: { name: string; url: string }[] = [];
  filteredPokemon: { name: string; url: string }[] = [];
  nextUrl: string | null = null;
  focusedPoke: { name: string; url: string } | null = null;
  detailedPoke: any = null;
  allDetailedPokes: any[] = [];
  loading: boolean = false;
  imgLoading: boolean = false;

  constructor() {}

  ngOnInit(): void {
    axios
      .get('https://pokeapi.co/api/v2/pokemon?limit=1500')
      .then(({ data }) => {
        this.nextUrl = data.next;
        const pokemon = data.results.filter((poke) => !poke.name.includes('-'));
        this.allPokemon = pokemon;
        this.filteredPokemon = pokemon;

        // remove next line after testing
        this.getPokemonDetails(pokemon[0]);
      })
      .catch(console.error);
  }

  // move focused poke up or down based on arrow key press
  @HostListener('document:keydown', ['$event'])
  handleArrowKey(e: KeyboardEvent) {
    const index = this.filteredPokemon.indexOf(this.focusedPoke);

    if (e.key === 'ArrowDown') {
      if (index === this.filteredPokemon.length - 1) return;
      this.getPokemonDetails(this.filteredPokemon[index + 1]);
    }
    if (e.key === 'ArrowUp') {
      if (index === 0) return;
      this.getPokemonDetails(this.filteredPokemon[index - 1]);
    }
  }

  getPokemonDetails(pokeParam: { name: string; url: string }) {
    this.focusedPoke = pokeParam;
    const { url, name } = pokeParam;
    // check if we already have the data
    if (this.allDetailedPokes.find((poke) => poke.name === name)) {
      this.detailedPoke = this.allDetailedPokes.find(
        (poke) => poke.name === name
      );
      return;
    }
    this.imgLoading = true;
    this.loading = true;
    axios
      .get(url)
      .then(({ data }) => {
        this.detailedPoke = data;
        // now get the description
        axios
          .get(data.species.url)
          .then(async ({ data: speciesData }) => {
            const englishDescription = speciesData.flavor_text_entries.find(
              (entry) => entry.language.name === 'en'
            );

            if (englishDescription) {
              const description = englishDescription.flavor_text;
              this.detailedPoke.desc = description;
            }

            // now get the species data
            const genderRate = speciesData.gender_rate;
            let gender = 'Genderless';
            if (genderRate === -1) {
              gender = 'Female only';
            } else if (genderRate === 0) {
              gender = 'Male only';
            } else if (genderRate >= 1 && genderRate <= 8) {
              gender = 'Mostly male';
            } else if (genderRate >= 9 && genderRate <= 15) {
              gender = 'Even gender ratio';
            } else if (genderRate >= 16 && genderRate <= 24) {
              gender = 'Mostly female';
            }
            speciesData.gender = gender;
            this.detailedPoke.species = speciesData;

            //now get the category
            const category = speciesData.genera.find(
              (genus) => genus.language.name === 'en'
            ).genus;
            this.detailedPoke.category = category;

            // now get the weaknesses
            const weaknesses = await this.getPokeWeaknesses(this.detailedPoke);
            this.detailedPoke.weaknesses = weaknesses;
          })
          .catch(console.error)
          .finally(() => {
            // save the data in temporary memory
            this.allDetailedPokes.push(this.detailedPoke);
            this.loading = false;
          });
      })
      .catch(console.error);
  }

  async getPokeWeaknesses(poke) {
    if (poke.types && Array.isArray(poke.types)) {
      const types = poke.types.map((typeData) => typeData.type.name);
      const typePromises = types.map((typeName) =>
        axios.get(`https://pokeapi.co/api/v2/type/${typeName}`)
      );

      const weaknessesSet = new Set();
      Promise.all(typePromises).then((typeResponses) => {
        typeResponses.forEach((typeResponse) => {
          const typeData = typeResponse.data;
          const typeWeaknesses = typeData.damage_relations.double_damage_from;
          typeWeaknesses.forEach((weakness) =>
            weaknessesSet.add(weakness.name)
          );
        });
      });
      return weaknessesSet;
    } else {
      console.error('Types field not found in species data.');
    }
  }

  filterPokemon(searchStr: string) {
    this.filteredPokemon = this.allPokemon
      .filter((poke) => poke.name.includes(searchStr.toLowerCase()))
      .sort((a, b) => {
        // Compare the indices of the search string in the names
        const indexA = a.name.indexOf(searchStr.toLowerCase());
        const indexB = b.name.indexOf(searchStr.toLowerCase());

        // Sort based on the index; lower index means closer match to the beginning
        return indexA - indexB;
      });
    this.getPokemonDetails(this.filteredPokemon[0]);
  }
}
