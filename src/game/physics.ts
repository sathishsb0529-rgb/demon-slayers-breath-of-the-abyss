import { ARENA_LEFT, ARENA_RIGHT, GROUND_Y, RAGDOLL_GRAVITY } from './constants';
import {
  Fighter,
  JointKey,
  JointPose,
  RagdollBody,
  VerletConstraint,
  VerletNode,
} from './types';

const JOINT_KEYS: JointKey[] = [
  'pelvis',
  'chest',
  'head',
  'lShoulder',
  'lElbow',
  'lHand',
  'rShoulder',
  'rElbow',
  'rHand',
  'lKnee',
  'lFoot',
  'rKnee',
  'rFoot',
];

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}

export function createEmptyRagdoll(): RagdollBody {
  const nodes = {} as Record<JointKey, VerletNode>;
  for (const key of JOINT_KEYS) {
    nodes[key] = {
      id: key,
      x: 0,
      y: 0,
      oldX: 0,
      oldY: 0,
      mass: key === 'chest' || key === 'pelvis' ? 2.2 : 1.0,
      radius: key === 'head' ? 12 : key === 'chest' ? 14 : 6.5,
    };
  }
  return {
    active: false,
    nodes,
    constraints: [],
    swordAngle: 0,
    swordAngularVel: 0,
    timer: 0,
    minDuration: 0.78,
    settledTime: 0,
    keepDown: false,
  };
}

export function activateRagdoll(
  fighter: Fighter,
  pose: JointPose,
  impulseX: number,
  impulseY: number,
  keepDown = false
): void {
  const r = fighter.ragdoll;
  r.active = true;
  r.timer = 0;
  r.minDuration = keepDown ? 999 : 0.72;
  r.settledTime = 0;
  r.keepDown = keepDown;

  for (const key of JOINT_KEYS) {
    const pt = pose[key];
    const node = r.nodes[key];
    node.x = pt.x;
    node.y = pt.y;

    const heightFactor = Math.max(0.4, Math.min(1.45, (fighter.y - pt.y) / 70));
    const jitterX = (Math.random() - 0.5) * 40;
    const jitterY = (Math.random() - 0.5) * 40;

    const vx = impulseX * (0.75 + heightFactor * 0.36) + jitterX;
    const vy = impulseY * (0.82 + (1 - heightFactor * 0.25)) + jitterY;

    const refDt = 1 / 60;
    node.oldX = node.x - vx * refDt;
    node.oldY = node.y - vy * refDt;
  }

  r.swordAngle = pose.swordAngle;
  r.swordAngularVel = Math.sign(impulseX || 1) * (5 + Math.random() * 5);

  const link = (a: JointKey, b: JointKey, stiffness = 0.96, minOnly = false): VerletConstraint => ({
    a,
    b,
    length: Math.max(6, dist(pose[a].x, pose[a].y, pose[b].x, pose[b].y)),
    stiffness,
    minOnly,
  });

  r.constraints = [
    link('pelvis', 'chest', 1.0),
    link('chest', 'head', 0.97),
    link('chest', 'lShoulder', 0.98),
    link('lShoulder', 'lElbow', 0.97),
    link('lElbow', 'lHand', 0.97),
    link('chest', 'rShoulder', 0.98),
    link('rShoulder', 'rElbow', 0.97),
    link('rElbow', 'rHand', 0.97),
    link('pelvis', 'lKnee', 0.98),
    link('lKnee', 'lFoot', 0.98),
    link('pelvis', 'rKnee', 0.98),
    link('rKnee', 'rFoot', 0.98),
    {
      a: 'pelvis',
      b: 'head',
      length: Math.max(38, dist(pose.pelvis.x, pose.pelvis.y, pose.head.x, pose.head.y) * 0.85),
      stiffness: 0.45,
      minOnly: true,
    },
    {
      a: 'lFoot',
      b: 'rFoot',
      length: 14,
      stiffness: 0.3,
      minOnly: true,
    },
  ];

  fighter.state = keepDown ? 'DEFEATED' : 'RAGDOLL';
  fighter.stateTimer = 0;
  fighter.currentAttack = null;
}

export interface RagdollStepResult {
  impactedGround: boolean;
  readyToRecover: boolean;
}

export function stepRagdoll(
  fighter: Fighter,
  dt: number,
  arenaLeft = ARENA_LEFT,
  arenaRight = ARENA_RIGHT
): RagdollStepResult {
  const r = fighter.ragdoll;
  if (!r.active) {
    return { impactedGround: false, readyToRecover: false };
  }

  r.timer += dt;
  const clampedDt = Math.min(dt, 0.033);
  const airDrag = 0.992;
  const groundFriction = 0.82;
  const bounce = 0.2;
  let impactedGround = false;

  for (const key of JOINT_KEYS) {
    const n = r.nodes[key];
    let vx = (n.x - n.oldX) * airDrag;
    let vy = (n.y - n.oldY) * airDrag;

    const maxStep = 25;
    vx = Math.max(-maxStep, Math.min(maxStep, vx));
    vy = Math.max(-maxStep, Math.min(maxStep, vy));

    n.oldX = n.x;
    n.oldY = n.y;
    n.x += vx;
    n.y += vy + RAGDOLL_GRAVITY * clampedDt * clampedDt;
  }

  r.swordAngle += r.swordAngularVel * clampedDt;
  r.swordAngularVel *= 0.96;

  const iterations = 6;
  for (let iter = 0; iter < iterations; iter++) {
    for (const c of r.constraints) {
      const a = r.nodes[c.a];
      const b = r.nodes[c.b];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.0001;

      if (c.minOnly && d >= c.length) continue;

      const diff = ((d - c.length) / d) * c.stiffness;
      const invMassA = 1 / a.mass;
      const invMassB = 1 / b.mass;
      const totalInv = invMassA + invMassB;

      a.x += dx * diff * (invMassA / totalInv);
      a.y += dy * diff * (invMassA / totalInv);
      b.x -= dx * diff * (invMassB / totalInv);
      b.y -= dy * diff * (invMassB / totalInv);
    }

    for (const key of JOINT_KEYS) {
      const n = r.nodes[key];
      const floorLimit = GROUND_Y - n.radius * 0.45;
      if (n.y > floorLimit) {
        const vy = n.y - n.oldY;
        const vx = n.x - n.oldX;
        if (vy > 3.8 && iter === 0) {
          impactedGround = true;
        }
        n.y = floorLimit;
        n.oldY = n.y + vy * bounce;
        n.oldX = n.x - vx * groundFriction;
        r.swordAngularVel *= 0.7;
      }

      if (n.x < arenaLeft + n.radius) {
        const vx = n.x - n.oldX;
        n.x = arenaLeft + n.radius;
        n.oldX = n.x + vx * 0.35;
      } else if (n.x > arenaRight - n.radius) {
        const vx = n.x - n.oldX;
        n.x = arenaRight - n.radius;
        n.oldX = n.x + vx * 0.35;
      }
    }
  }

  // Keep sword naturally aligned with forearm in ragdoll so it stays firmly held
  const rElbow = r.nodes.rElbow;
  const rHand = r.nodes.rHand;
  const armAngle = Math.atan2(rHand.y - rElbow.y, rHand.x - rElbow.x);
  r.swordAngle = armAngle + 0.35 * Math.sin(r.timer * 4);

  const pelvis = r.nodes.pelvis;
  fighter.x = Math.max(arenaLeft + 20, Math.min(arenaRight - 20, pelvis.x));
  fighter.y = GROUND_Y;
  fighter.vx = (pelvis.x - pelvis.oldX) / Math.max(clampedDt, 0.008);
  fighter.vy = (pelvis.y - pelvis.oldY) / Math.max(clampedDt, 0.008);

  const chest = r.nodes.chest;
  const speed =
    Math.hypot(pelvis.x - pelvis.oldX, pelvis.y - pelvis.oldY) +
    Math.hypot(chest.x - chest.oldX, chest.y - chest.oldY);

  const nearGround = pelvis.y >= GROUND_Y - 54 && chest.y >= GROUND_Y - 68;
  if (nearGround && speed < 3.4) {
    r.settledTime += dt;
  } else {
    r.settledTime = Math.max(0, r.settledTime - dt * 0.5);
  }

  const readyToRecover =
    !r.keepDown &&
    r.timer >= r.minDuration &&
    (r.settledTime >= 0.22 || r.timer >= 1.5);

  return { impactedGround, readyToRecover };
}

export function ragdollToJointPose(fighter: Fighter): JointPose {
  const n = fighter.ragdoll.nodes;
  const dx = n.chest.x - n.pelvis.x;
  const dy = n.chest.y - n.pelvis.y;
  const torsoTilt = Math.atan2(dx, -dy);

  const hdx = n.head.x - n.chest.x;
  const hdy = n.head.y - n.chest.y;
  const headTilt = Math.atan2(hdx, -hdy);

  const offhandAngle = Math.atan2(n.lHand.y - n.lElbow.y, n.lHand.x - n.lElbow.x);

  return {
    pelvis: { x: n.pelvis.x, y: n.pelvis.y },
    chest: { x: n.chest.x, y: n.chest.y },
    head: { x: n.head.x, y: n.head.y },
    lShoulder: { x: n.lShoulder.x, y: n.lShoulder.y },
    lElbow: { x: n.lElbow.x, y: n.lElbow.y },
    lHand: { x: n.lHand.x, y: n.lHand.y },
    rShoulder: { x: n.rShoulder.x, y: n.rShoulder.y },
    rElbow: { x: n.rElbow.x, y: n.rElbow.y },
    rHand: { x: n.rHand.x, y: n.rHand.y },
    lKnee: { x: n.lKnee.x, y: n.lKnee.y },
    lFoot: { x: n.lFoot.x, y: n.lFoot.y },
    rKnee: { x: n.rKnee.x, y: n.rKnee.y },
    rFoot: { x: n.rFoot.x, y: n.rFoot.y },
    swordAngle: fighter.ragdoll.swordAngle,
    offhandAngle,
    torsoTilt,
    headTilt,
    scaleX: 1,
    scaleY: 1,
  };
}
