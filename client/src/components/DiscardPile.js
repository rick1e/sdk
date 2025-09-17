
import {renderCard} from "../utils/utilsRender";

export const DiscardPile = ({discardPile }) => {

    return(
        <div className="game-section">
            <h4>🗂️ Top of Discard Pile</h4>
            <div className="cards-container">
                {renderCard(discardPile.slice(-1)[0])}
            </div>
        </div>
    );
}