import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

@Controller('director')
export class DirectorController {
    constructor(private readonly directorService: DirectorService) {}

    @Get()
    getDirectors() {
        return this.directorService.findAll();
    }

    @Get(':id')
    getDirector(@Param('id') id: string) {
        return this.directorService.findOne(+id);
    }

    @Post()
    postDirector(@Body() createDirectorDto: CreateDirectorDto) {
        return this.directorService.create(createDirectorDto);
    }

    @Patch(':id')
    patchDirector(@Param('id') id: string, @Body() updateDirectorDto: UpdateDirectorDto) {
        return this.directorService.update(+id, updateDirectorDto);
    }

    @Delete(':id')
    deleteDirector(@Param('id') id: string) {
        return this.directorService.remove(+id);
    }
}
