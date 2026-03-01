# navOdomConverter

This extension registers a schema message converter for ROS1 `nav_msgs/Odometry`:

- `nav_msgs/Odometry` -> `foxglove.SceneUpdate`

It renders odometry in the 3D panel as:

- a body cube
- a heading arrow
- a linear-velocity line (when non-zero)

## Develop


To build and install the extension into your local Foxglove desktop app, run:

```sh
yarn local-install
```

Open the Foxglove desktop (or `ctrl-R` to refresh if it is already open). Your extension is installed and available within the app.

## Use in 3D Panel

1. Open Foxglove Desktop.
2. Add a 3D panel to your layout.
3. Connect to your ROS1 source and select a topic with schema `nav_msgs/Odometry`.
4. Add that topic in the 3D panel.

Foxglove will apply the converter automatically and visualize the generated `SceneUpdate` markers.

