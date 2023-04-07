import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class addMessageDto {
    @IsNotEmpty() @IsString() readonly message: string;
};

export class changeLocDto {
    @IsNotEmpty() @IsUUID() readonly loc: string;
    @IsNotEmpty() @IsBoolean() readonly isChannel: boolean;
};

export class channelIdDto {
    @IsNotEmpty() @IsUUID() readonly channelId: string;
};

export class joinChannelDto {
    @IsNotEmpty() @IsUUID() readonly channelId: string;
    @IsString() @IsOptional() readonly channelPass: string;
};

export class inviteUserDto {
    @IsNotEmpty() @IsUUID() readonly userToInvite: string;
    @IsNotEmpty() @IsUUID() readonly channelId: string;
};

export class kickUserDto {
    @IsNotEmpty() @IsUUID() readonly userToKick: string;
    @IsNotEmpty() @IsUUID() readonly channelId: string;
};

export class makeHimOpDto {
    @IsNotEmpty() @IsUUID() readonly userToOp: string;
    @IsNotEmpty() @IsUUID() readonly channelId: string;
};

export class makeHimNoOpDto {
    @IsNotEmpty() @IsUUID() readonly userToNoOp: string;
    @IsNotEmpty() @IsUUID() readonly channelId: string;
}

export class createChannelDto {
	@IsNotEmpty() @IsString() readonly name: string;
	@IsNotEmpty() @IsBoolean() readonly password: boolean;
	@IsString() readonly channelPass: string;
	@IsNotEmpty() @IsBoolean() readonly inviteOnly: boolean;
	@IsNotEmpty() @IsBoolean() readonly hidden: boolean;
}