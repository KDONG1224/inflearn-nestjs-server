import { BadRequestException, Module } from '@nestjs/common';
import { CommonService } from '../services/common.service';
import { CommonController } from '../controllers/common.controller';

import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import { TEMP_FOLDER_PATH } from 'src/common/consts/path.const';
import * as multer from 'multer';
import { v4 as uuid } from 'uuid';
import { AuthModule } from 'src/auth/modules/auth.module';
import { UsersModule } from 'src/users/modules/users.module';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        // 바이트 단위
        fieldSize: 25 * 1024 * 1024
      },
      fileFilter: (req, file, callback) => {
        /**
         * callback(error, boolean)
         *
         * 첫번째 인자: 에러
         * 두번째 인자: 다운로드 여부, true면 허용, false면 거부
         */

        // xxx.jpg -> .jpg
        const ext = extname(file.originalname);

        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
          return callback(
            new BadRequestException('JPG, JPEG, PNG 만 업로드가 가능합니다.'),
            false
          );
        }

        return callback(null, true);
      },
      storage: multer.diskStorage({
        destination: function (req, res, callback) {
          callback(null, TEMP_FOLDER_PATH);
        },
        filename: function (req, file, callback) {
          callback(null, `${uuid()}${extname(file.originalname)}`);
        }
      })
    }),
    AuthModule,
    UsersModule
  ],
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonService]
})
export class CommonModule {}
