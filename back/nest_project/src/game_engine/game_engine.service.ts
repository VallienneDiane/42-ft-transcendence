import { Injectable } from '@nestjs/common';

@Injectable()
export class GameEngineService {
	hello() {
		console.log('heuuu ca marche ?');
	}
}
