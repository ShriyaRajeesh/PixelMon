import { CHARACTER_ASSET_KEYS } from "../asset_keys";
import { DATA_MANAGER_KEYS, dataManager } from "../data_manager";
import { DIRECTION, Direction } from "../direction";
import { Character, CharacterConfig } from "./character";
type PlayerConfig = Omit<CharacterConfig, "assetKey"|"assetFrame">;


export class Player extends Character{
    private pokemonTeam: any[];
    private isLocked: boolean = false;
    constructor(config:PlayerConfig){
        super({
            ...config,
            assetKey:CHARACTER_ASSET_KEYS.PLAYER,
            assetFrame:0,
        });
        this.pokemonTeam = dataManager.storeData.get(DATA_MANAGER_KEYS.PLAYER_TEAM) || [];
         
    }

    lockMovement() {
        this.isLocked = true;
    }
    unlockMovement() {
        this.isLocked = false;
    }
    

    moveCharacter(direction: Direction) {
        if (this.isLocked) return; // Prevent movement if locked
    
        super.moveCharacter(direction);
    
        switch (this.direction) {
            case DIRECTION.DOWN:
            case DIRECTION.LEFT:
            case DIRECTION.UP:
            case DIRECTION.RIGHT:
                if (this.phaserGameObject.anims.currentAnim?.key !== `PLAYER_${this.direction}`) {
                    this.phaserGameObject.anims.play(`PLAYER_${this.direction}`);
                }
                break;
        }
    }
        getPokemonTeam() {
            return this.pokemonTeam;
        }

        updatePokemonTeam(updatedTeam: any[]) {
            this.pokemonTeam = updatedTeam;
            dataManager.storeData.set(DATA_MANAGER_KEYS.PLAYER_TEAM, updatedTeam);
        }
}