import { Injectable } from '@nestjs/common';

@Injectable()
export class GameEngineService {
	hello() {
		console.log('heuuu ca marche ?');
	}

	main_loop() {
		console.log("game was updated");
		setTimeout(this.main_loop, 1000/60);
	}
}
