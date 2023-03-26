import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-42";
import { Injectable } from "@nestjs/common";

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, '42') {
    constructor() {
        super({
            clientID: process.env.API_UID,
            clientSecret: process.env.API_KEY,
            callbackURL: process.env.API_CALLBACK_URL,
            scope: 'public',
            profileFields: {
                'id': function (obj: any) { return String(obj.id); },
                'username': 'login',
                'displayName': 'displayname',
                'name.familyName': 'last_name',
                'name.givenName': 'first_name',
                'profileUrl': 'url',
                'emails.0.value': 'email',
                'phoneNumbers.0.value': 'phone',
                'photos.0.value': 'image_url'
            }
        });
    }
    async validate(accessToken: string, refreshToken: string, profile: any) { //done: any
        console.log("validate 42 strategy");
        const { id, username, displayName, emails } = profile;
        refreshToken;
        const user = {
            id: id,
            login: username,
            username: displayName,
            email: emails[0].value
        };
        accessToken;
        // done(null, user);
        return accessToken ;
    }
}
