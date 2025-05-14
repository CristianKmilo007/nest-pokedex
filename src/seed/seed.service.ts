import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PokeResponse } from './interfaces/poke-response.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';

@Injectable()
export class SeedService {
  constructor(
    private readonly http: HttpService,

    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async executeSeed() {
    await this.pokemonModel.deleteMany({});

    // firstValueFrom convierte el Observable en Promise
    const response = await firstValueFrom(
      this.http.get<PokeResponse>(
        'https://pokeapi.co/api/v2/pokemon?limit=650',
      ),
    );

    const pokemoToInsert: {
      name: string;
      no: number;
    }[] = [];

    response.data.results.map(({ name, url }) => {
      const no = Number(url.split('/').at(-2));
      pokemoToInsert.push({ name, no });
    });

    await this.pokemonModel.insertMany(pokemoToInsert);

    return 'Seed executed';
  }
}
