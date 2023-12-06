import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { CommonService } from '../services/common.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  postUploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      fileName: file.filename
    };
  }
}
