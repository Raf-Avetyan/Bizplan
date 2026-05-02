import { Body, Controller, Post } from '@nestjs/common';
import { Auth } from '../auth/common/decorators/auth.decorator';
import { ImageGenerationService } from './image-generation.service';

@Controller('image-generation')
@Auth()
export class ImageGenerationController {
  constructor(private readonly imageGenerationService: ImageGenerationService) {}

  @Post()
  generate(@Body('prompt') prompt: string) {
    return this.imageGenerationService.generate(prompt);
  }
}
