# @thanh01.pmt/quest-player

A React component library for creating and playing interactive coding quests, inspired by Blockly Games. This package provides a self-contained `<QuestPlayer>` component that handles game logic, rendering, and block-based/text-based code editing.

## Installation

You can install the package using npm, pnpm, or yarn:

```bash
pnpm add @thanh01.pmt/quest-player
```

## Usage

Here's a basic example of how to use the `QuestPlayer` component in a React application. You'll need to provide it with a valid Quest JSON object.

```jsx
import React, { useState, useEffect } from 'react';
import { QuestPlayer } from '@thanh01.pmt/quest-player';
import '@thanh01.pmt/quest-player/dist/index.css'; // Don't forget to import the CSS

function App() {
  const [questData, setQuestData] = useState(null);

  useEffect(() => {
    // In a real application, you would fetch your quest JSON file
    fetch('/path/to/your/quest.json')
      .then(res => res.json())
      .then(data => setQuestData(data));
  }, []);

  const handleQuestComplete = (result) => {
    console.log('Quest Complete!', result);
    if (result.isSuccess) {
      alert('Congratulations! You solved the puzzle.');
    } else {
      alert('Try again!');
    }
  };
  
  const handleSettingsChange = (newSettings) => {
    console.log('Settings changed', newSettings);
  }

  if (!questData) {
    return <div>Loading quest...</div>;
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <QuestPlayer
        isStandalone={false}
        questData={questData}
        language="en"
        initialSettings={{}}
        onQuestComplete={handleQuestComplete}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}

export default App;
```

## Intro Scene (3D Maze)

For 3D maze games, you can configure an intro camera animation that plays when the quest loads. This provides an overview of the maze before the player starts coding.

### Configuration

Add an `introScene` object to your `gameConfig`:

```json
{
  "gameConfig": {
    "type": "maze",
    "renderer": "3d",
    "introScene": {
      "enabled": true,
      "type": "circle",
      "duration": 4000,
      "radius": 25,
      "loops": 1
    }
  }
}
```

### Available Types

| Type | Description | Parameters |
|------|-------------|------------|
| `dronie` | Camera flies backward, keeping map center in frame | `distance` |
| `rocket` | Camera rises straight up, looking down | `height` |
| `circle` | Camera orbits around the map center | `radius`, `loops` |
| `helix` | Camera spirals around and up | `radius`, `height`, `loops` |
| `boomerang` | Camera moves in an oval pattern, rising and falling | `radiusX`, `radiusZ`, `height` |

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | boolean | - | Enable/disable intro scene |
| `type` | string | - | Animation type (see table above) |
| `duration` | number | 4000 | Duration in milliseconds |
| `distance` | number | 20 | Distance for dronie |
| `height` | number | 15 | Height for rocket/helix/boomerang |
| `radius` | number | 25 | Radius for circle/helix |
| `radiusX` | number | 30 | X-axis radius for boomerang |
| `radiusZ` | number | 20 | Z-axis radius for boomerang |
| `loops` | number | 1 | Number of loops for circle/helix |

> **Note**: If `introScene` is not configured or `enabled` is `false`, the game starts immediately without any intro animation.

## License

This project is licensed under the Apache-2.0 License.
