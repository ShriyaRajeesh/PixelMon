export interface Pokemon {
   PokemonId: number;
   name: string;
   assetKey: string;
   assetFrame: number;
   currentLevel: number;
   currentHp: number;
   maxHp: number;
   attackIds: number[];
   baseAttack: number;
   type: string;
   catchRate: number;
   experience: number; // Added experience property
   level?: number; // Make this optional
   spriteKeyFront?: string; // Make this optional
   spriteKeyBack?: string; // Make this optional
   moves?: []; // Make this optional
   evolvesTo: string; // Make this optional
   evolutionLevel: number; // Make this optional
 }
export interface BattlePokemonConfig {
   scene: Phaser.Scene;
   _pokemonDetails: Pokemon;
}

export interface Coordinate {
   x: number;
   y: number;
}

export interface Attack {
   id: number;
   name : string;
   animationName: string;
}

export interface Npc {
   position: Coordinate;
   team: Pokemon[];
 }
 
