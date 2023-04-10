import { Body, Controller, Get, Post } from "@nestjs/common";
import { MatchService } from "./Match.service";

@Controller('Match')
export class MatchController {

	constructor(private matchService: MatchService) {

	}

	@Get()
	getMatch() {}

}