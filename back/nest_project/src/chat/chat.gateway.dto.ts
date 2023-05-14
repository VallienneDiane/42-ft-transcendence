import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, MaxLength } from "class-validator";

export class addMessageDto {
    @IsNotEmpty() @IsString() @MaxLength(2048) readonly message: string;
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
    @IsNotEmpty() @IsString() readonly userToInvite: string;
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
}

export class modifyChannelDto {
    @IsNotEmpty() @IsUUID() readonly id: string;
    @IsNotEmpty() @IsString() readonly name: string;
    @IsNotEmpty() @IsBoolean() readonly password: boolean;
    @IsOptional() @IsString() readonly channelPass: string;
    @IsNotEmpty() @IsBoolean() readonly inviteOnly: boolean;
}

export class blockUserDto {
    @IsNotEmpty() @IsUUID() readonly id: string;
}

export class banUserDto {
    @IsNotEmpty() @IsUUID() readonly id: string;
    @IsNotEmpty() @IsUUID() readonly channelId: string;
}

export class unbanUserDto {
    @IsNotEmpty() @IsUUID() readonly userId: string;
    @IsNotEmpty() @IsUUID() readonly channelId: string;
}

export class muteUserDto {
    @IsNotEmpty() @IsUUID() readonly id: string;
    @IsNotEmpty() @IsUUID() readonly channelId: string;
    @IsNotEmpty() @IsNumber() @IsPositive() @Max(1440) readonly minutes: number; 
}

export class unmuteUserDto {
    @IsNotEmpty() @IsUUID() readonly id: string;
    @IsNotEmpty() @IsUUID() readonly channelId: string;
}

export class isConnectedDto {
    @IsNotEmpty() @IsUUID() readonly userId: string;
}

export class getBanListDto {
    @IsNotEmpty() @IsUUID() readonly channelId: string;
}