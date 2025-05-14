import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  findAll(paginationDto: PaginationDto) {

    const {
      limit = 10,
      offset = 0
    } = paginationDto

    return this.pokemonModel.find()
      .limit(limit)
      .skip(offset)
      .sort({no:1})
      .select('-__v');
  }

  async findOne(term: string) {
    const cleanTerm = term.toLowerCase().trim();
    const orConditions: Record<string, any>[] = [{ name: cleanTerm }];

    if (!isNaN(+cleanTerm)) {
      orConditions.unshift({ no: +cleanTerm });
    }

    if (isValidObjectId(cleanTerm)) {
      orConditions.unshift({ _id: cleanTerm });
    }

    const pokemon = await this.pokemonModel.findOne({ $or: orConditions });

    if (!pokemon) {
      throw new NotFoundException(
        `Pokémon con id, nombre o número '${term}' no encontrado`,
      );
    }

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);

    if (updatePokemonDto.name)
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();

    try {
      await pokemon.updateOne(updatePokemonDto, { new: true });
      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });

    if (deletedCount === 0)
      throw new BadRequestException(`Pokemon with id '${id}' not found`);

    return;
  }

  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(
        `Pokemon exist in db ${JSON.stringify(error.keyValue)}`,
      );
    }

    throw new InternalServerErrorException(
      `Can't create Pokemon - Check server logs`,
    );
  }
}
