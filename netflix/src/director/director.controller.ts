import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ClassSerializerInterceptor,
    UseInterceptors,
    ParseIntPipe,
} from '@nestjs/common';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

@Controller('director')
@UseInterceptors(ClassSerializerInterceptor)
export class DirectorController {
    constructor(private readonly directorService: DirectorService) {}

    @Get()
    getDirectors() {
        return this.directorService.findAll();
    }

    @Get(':id')
    getDirector(@Param('id', ParseIntPipe) id: string) {
        return this.directorService.findOne(+id);
    }

    @Post()
    postDirector(@Body() createDirectorDto: CreateDirectorDto) {
        return this.directorService.create(createDirectorDto);
    }

    @Patch(':id')
    patchDirector(@Param('id', ParseIntPipe) id: string, @Body() updateDirectorDto: UpdateDirectorDto) {
        return this.directorService.update(+id, updateDirectorDto);
    }

    @Delete(':id')
    deleteDirector(@Param('id', ParseIntPipe) id: string) {
        return this.directorService.remove(+id);
    }
}
