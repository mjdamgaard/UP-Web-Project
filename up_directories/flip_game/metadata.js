
import {getHomeDirID} from 'route';
const homeDirID = getHomeDirID();

export default {
  "Name": "Flip game",
  "Is ready for use": true,
  "apiDefiningAppDirID": homeDirID,
  "Description": <div>
    <h2>Flip game</h2>
    <p>
      A randomly generated puzzle game where the goal is to turn all the
      squares white, by selecting one square at a time to flip, making its
      color change along with the color of each of its neighbors.
    </p>
  </div>,
};