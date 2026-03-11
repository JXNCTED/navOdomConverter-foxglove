import { ExtensionContext, Immutable, MessageEvent } from "@foxglove/extension";
import { SceneUpdate, Time } from "@foxglove/schemas";

type RosTime = {
  sec?: number;
  nsec?: number;
  secs?: number;
  nsecs?: number;
};

type RosVector3 = {
  x: number;
  y: number;
  z: number;
};

type RosQuaternion = {
  x: number;
  y: number;
  z: number;
  w: number;
};

type RosOdometry = {
  header?: {
    stamp?: RosTime;
    frame_id?: string;
  };
  child_frame_id?: string;
  pose?: {
    pose?: {
      position?: Partial<RosVector3>;
      orientation?: Partial<RosQuaternion>;
    };
  };
  twist?: {
    twist?: {
      linear?: RosVector3;
    };
  };
};

const ZERO_DURATION = { sec: 0, nsec: 0 } as const;

function asFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toTime(stamp: RosTime | undefined): Time {
  if (stamp == undefined) {
    return { sec: 0, nsec: 0 };
  }
  const sec = Math.trunc(asFiniteNumber(stamp.sec ?? stamp.secs, 0));
  const nsec = Math.trunc(asFiniteNumber(stamp.nsec ?? stamp.nsecs, 0));
  return { sec, nsec };
}

function odometryToSceneUpdate(
  msg: RosOdometry,
  event: Immutable<MessageEvent<RosOdometry>>,
): SceneUpdate | undefined {
  const frameId = msg.header?.frame_id;
  const pose = msg.pose?.pose;
  if (frameId == undefined || frameId === "" || pose == undefined) {
    return undefined;
  }

  const childFrameIdRaw = msg.child_frame_id?.trim();
  const childFrameId =
    childFrameIdRaw == undefined || childFrameIdRaw === "" ? "base_link" : childFrameIdRaw;
  const rawPosition = pose.position;
  const rawOrientation = pose.orientation;
  const position = {
    x: asFiniteNumber(rawPosition?.x),
    y: asFiniteNumber(rawPosition?.y),
    z: asFiniteNumber(rawPosition?.z),
  };
  const orientation = {
    x: asFiniteNumber(rawOrientation?.x),
    y: asFiniteNumber(rawOrientation?.y),
    z: asFiniteNumber(rawOrientation?.z),
    w: asFiniteNumber(rawOrientation?.w, 1),
  };

  const timestamp = toTime(msg.header?.stamp);
  const poseEntityId = `odom:${childFrameId}:pose`;

  const update: SceneUpdate = {
    deletions: [],
    entities: [
      {
        timestamp,
        frame_id: frameId,
        id: poseEntityId,
        lifetime: ZERO_DURATION,
        frame_locked: false,
        metadata: [
          { key: "source_topic", value: event.topic },
          { key: "child_frame_id", value: childFrameId },
        ],
        arrows: [
          {
            pose: { position, orientation },
            shaft_length: 0.5,
            shaft_diameter: 0.02,
            head_length: 0.1,
            head_diameter: 0.04,
            color: { r: 1.0, g: 0.64, b: 0.0, a: 1.0 },
          },
        ],
        cubes: [
          {
            pose: { position, orientation },
            size: { x: 0.25, y: 0.25, z: 0.15 },
            color: { r: 0.16, g: 0.53, b: 0.95, a: 1.0 },
          },
        ],
        spheres: [],
        cylinders: [],
        lines: [],
        triangles: [],
        texts: [],
        models: [],
      },
    ],
  };

  return update;
}

export function activate(extensionContext: ExtensionContext): void {
  for (const fromSchemaName of ["nav_msgs/Odometry", "nav_msgs/msg/Odometry"] as const) {
    extensionContext.registerMessageConverter<RosOdometry>({
      type: "schema",
      fromSchemaName,
      toSchemaName: "foxglove.SceneUpdate",
      converter: odometryToSceneUpdate,
    });
  }
}
