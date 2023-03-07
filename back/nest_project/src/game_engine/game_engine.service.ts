import { Injectable } from '@nestjs/common';

@Injectable()
export class GameEngineService {
	hello() {
		console.log('heuuu ca marche ?');
	}

	main_loop() {
		console.log("game was updated");
	}
}
