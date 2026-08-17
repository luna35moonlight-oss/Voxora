import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { PetCardRaceController } from './pet-card-race/pet-card-race.controller';
import { PetCardRaceService } from './pet-card-race/pet-card-race.service';

@Module({
  imports: [AuthModule],
  controllers: [GamesController, PetCardRaceController],
  providers: [GamesService, PetCardRaceService],
})
export class GamesModule {}
