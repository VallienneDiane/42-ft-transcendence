import Avatar from 'avataaars';

interface Configs {
  topType: string[],
  accessoriesType: string[],
  hatColor: string[],
  hairColor: string[],
  facialHairType: string[],
  facialHairColor: string[],
  clotheType: string[],
  clotheColor: string[],
  graphicType: string[],
  eyeType: string[],
  eyebrowType: string[],
  mouthType: string[],
  skinColor: string[],
}

const configs = {
    topType: [
      'NoHair',
      'Hat',
      'WinterHat1',
      'WinterHat2',
      'WinterHat3',
      'WinterHat4',
      'LongHairBigHair',
      'LongHairBob',
      'LongHairBun',
      'LongHairCurly',
      'LongHairCurvy',
      'LongHairDreads',
      'LongHairFrida',
      'LongHairFro',
      'LongHairFroBand',
      'LongHairNotTooLong',
      'LongHairShavedSides',
      'LongHairMiaWallace',
      'LongHairStraight',
      'LongHairStraight2',
      'LongHairStraightStrand',
      'ShortHairDreads01',
      'ShortHairDreads02'
    ],
    accessoriesType: [
      'Blank',
      'Blank',
      'Blank',
      'Prescription01',
      'Prescription02',
      'Round',
    ],
    hatColor: [
      'Black',
      'Blue01',
      'Blue02',
      'Blue03',
      'Gray01',
      'Gray02',
      'Heather',
      'PastelBlue',
      'PastelGreen',
      'PastelOrange',
      'PastelRed',
      'PastelYellow',
      'Pink',
      'Red',
      'White'
    ],
    hairColor: [
      'Auburn',
      'Black',
      'Blonde',
      'BlondeGolden',
      'Brown',
      'BrownDark',
      'PastelPink',
      'Platinum',
      'Red',
      'SilverGray'
    ],
    facialHairType: [
      'Blank',
      'BeardMedium',
      'BeardLight',
      'BeardMajestic',
      'MoustacheFancy',
      'MoustacheMagnum'
    ],
    facialHairColor: [
      'Auburn',
      'Black',
      'Blonde',
      'BlondeGolden',
      'Brown',
      'BrownDark',
      'Platinum',
      'Red'
    ],
    clotheType: [
      'BlazerShirt',
      'BlazerSweater',
      'CollarSweater',
      'GraphicShirt',
      'Hoodie',
      'Overall',
      'ShirtCrewNeck',
      'ShirtScoopNeck',
      'ShirtVNeck'
    ],
    clotheColor: [
      'Black',
      'Blue01',
      'Blue02',
      'Blue03',
      'Gray01',
      'Gray02',
      'Heather',
      'PastelBlue',
      'PastelGreen',
      'PastelOrange',
      'PastelRed',
      'PastelYellow',
      'Pink',
      'Red',
      'White'
    ],
    graphicType: [
      'Bat',
      'Cumbia',
      'Deer',
      'Diamond',
      'Hola',
      'Pizza',
      'Resist',
      'Selena',
      'Bear',
      'SkullOutline',
      'Skull'
    ],
    eyeType: [
      'Close',
      'Default',
      'EyeRoll',
      'Happy',
      'Side',
      'Squint',
      'Surprised',
      'Wink',
      'WinkWacky'
    ],
    eyebrowType: [
      'AngryNatural',
      'Default',
      'DefaultNatural',
      'FlatNatural',
      'RaisedExcited',
      'RaisedExcitedNatural',
      'SadConcerned',
      'SadConcernedNatural',
      'UnibrowNatural',
      'UpDown',
      'UpDownNatural'
    ],
    mouthType: [
      'Concerned',
      'Default',
      'Eating',
      'Grimace',
      'ScreamOpen',
      'Serious',
      'Smile',
      'Tongue',
      'Twinkle',
    ],
    skinColor: [
      'Tanned',
      'Yellow',
      'Pale',
      'Light',
      'Brown',
      'DarkBrown',
    ]
  }
  
  const configsKeys = Object.keys(configs);
  
  export function generateRandomAvatarOptions() {
    const options = { }
    const keys = [...configsKeys]
    keys.forEach(key => {
      const configArray = configs[key];
      options[key] = configArray[Math.floor(Math.random()*configArray.length)];
    })
  
    return (
      <Avatar style={{ width: '100px', height: '100px' }}
      avatarStyle='Circle'
      {...options} />
    );
  }