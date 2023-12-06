import { IsOptional, IsString } from 'class-validator';
import { CreatePostDto } from './create-post.dto';
import { PartialType } from '@nestjs/mapped-types';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsString({
    message: stringValidationMessage
  })
  @IsOptional()
  title?: string;

  @IsString({
    message: stringValidationMessage
  })
  @IsOptional()
  content?: string;
}
