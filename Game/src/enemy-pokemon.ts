import { BattlePokemon } from "./battle-pokemon";
import { BattlePokemonConfig , Coordinate } from "./typedef"
// import { POKEMON } from "./asset_keys";

const ENEMY_LOCATION: Coordinate = {
    x: 700,
    y: 180, 
};


export class enemyPokemon extends BattlePokemon{
    constructor(config : BattlePokemonConfig){
        super(config, ENEMY_LOCATION);
        this._scene.anims.create({
            key: '_phaserGameObject',
            frames: this._scene.anims.generateFrameNames(this._pokemonDetails.name),
            frameRate: 5,
            repeat: -1, // Loop indefinitely
        });
        
    }
    // In your enemyPokemon class
hidePokemon() {
    // Hide the main sprite with a fade-out effect
    if (this._phaserGameObject) {
        this._scene.tweens.add({
            targets: this._phaserGameObject,
            alpha: 0,
            duration: 5,
            ease: 'Power1',
            onComplete: () => {
                this._phaserGameObject.setVisible(false);
            }
        });
    }
    
    // Hide the health bar
    if (this._phaserHealthBarGameContainer) {
        this._phaserHealthBarGameContainer.setVisible(false);
    }
    
    // Hide any other visual elements like status effects
    // Example: if (this.statusEffect) this.statusEffect.setVisible(false);
}

showPokemon() {
    // Make sure all elements are visible
    if (this._phaserGameObject) {
        this._phaserGameObject.setVisible(true);
        this._scene.tweens.add({
            targets: this._phaserGameObject,
            alpha: 1,
            duration: 5,
            ease: 'Power1'
        });
    }
    
    if (this._phaserHealthBarGameContainer) {
        this._phaserHealthBarGameContainer.setVisible(true);
    }
}
}