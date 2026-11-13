import { SoundEngine } from './audio';
import { buildBreathingAttackSpec } from './breathing';
import { DEMON_ATTACK_SPECS, PLAYER_JUMP_VELOCITY } from './constants';
import { DEMON_ABILITY_DB, DEMON_TEMPLATES } from './demons';
import { ParticleSystem } from './particles';
import { BdaProjectile, DemonArchetype, Fighter } from './types';

export interface AiBdaSpawn {
  projectiles?: Omit<BdaProjectile, 'id'>[];
  projectile?: Omit<BdaProjectile, 'id'>;
  spawnCloneArchetype?: DemonArchetype;
  triggerRoomShift?: boolean;
  teleportToX?: number;
  telegraphText?: string | null;
}

export class EnemyAI {
  private decisionCooldown = 0.4;
  private attackCooldown = 0.75;
  private bdaCooldown = 2.4;
  private ultimateCooldown = 8.5;
  private cloneCooldown = 9.0;
  private defenseCooldown = 1.6;
  private strafeDir: -1 | 0 | 1 = 0;
  private strafeTimer = 0;
  private activeTelegraph: string | null = null;
  private telegraphTimer = 0;

  public reset(): void {
    this.decisionCooldown = 0.42;
    this.attackCooldown = 0.8;
    this.bdaCooldown = 2.2;
    this.ultimateCooldown = 8.5;
    this.cloneCooldown = 7.5;
    this.defenseCooldown = 1.4;
    this.strafeDir = 0;
    this.strafeTimer = 0;
    this.activeTelegraph = null;
    this.telegraphTimer = 0;
  }

  public getTelegraph(): string | null {
    return this.telegraphTimer > 0 ? this.activeTelegraph : null;
  }

  private setTelegraph(text: string, duration = 0.95): void {
    this.activeTelegraph = text;
    this.telegraphTimer = duration;
  }

  public update(
    demon: Fighter,
    targets: Fighter[],
    dt: number,
    sound: SoundEngine,
    particles: ParticleSystem,
    allowCloneSpawn = true
  ): AiBdaSpawn | null {
    this.telegraphTimer = Math.max(0, this.telegraphTimer - dt);
    if (this.telegraphTimer <= 0) {
      this.activeTelegraph = null;
    }

    if (demon.hp <= 0 || demon.state === 'DEFEATED') {
      demon.vx = 0;
      this.activeTelegraph = null;
      return null;
    }

    const arch = demon.demonArchetype ?? 'basic';
    const template = DEMON_TEMPLATES[arch];
    const specDb = DEMON_ABILITY_DB[arch];
    const chillFactor = demon.chillTimer > 0 ? 0.65 : 1.0;

    // Multi-phase transitions for 2-phase & 3-phase bosses
    const hpRatio = demon.hp / demon.maxHp;
    if (specDb.phases >= 3 && hpRatio <= 0.35 && demon.bossPhase < 3) {
      demon.bossPhase = 3;
      sound.playTransformation();
      sound.playDemonRoar();
      this.setTelegraph(`${template.displayName.split('·')[0].trim()} · PHASE III FRENZY!`, 1.4);
      particles.spawnFloatingText(demon.x, demon.y - 135, 'FINAL FRENZY PHASE III!', template.bdaColor, 1.35);
    } else if (specDb.phases >= 2 && hpRatio <= 0.65 && demon.bossPhase < 2) {
      demon.bossPhase = 2;
      sound.playTransformation();
      this.setTelegraph(`${template.displayName.split('·')[0].trim()} · AWAKENED PHASE II`, 1.2);
      particles.spawnFloatingText(demon.x, demon.y - 135, 'AWAKENED PHASE II!', template.bdaColor, 1.25);
    }

    // Demon cellular regeneration (paused while staggered in ragdoll or poisoned)
    if (template.regenPerSec > 0 && demon.state !== 'RAGDOLL' && demon.poisonTimer <= 0) {
      demon.regenTimer += dt;
      if (demon.regenTimer >= 1.0) {
        demon.regenTimer = 0;
        const heal = Math.round(template.regenPerSec * (demon.bossPhase === 3 ? 1.5 : demon.bossPhase === 2 ? 1.25 : 1));
        if (demon.hp < demon.maxHp) {
          demon.hp = Math.min(demon.maxHp, demon.hp + heal);
        }
      }
    }

    if (
      demon.state === 'RAGDOLL' ||
      demon.state === 'GETTING_UP' ||
      demon.state === 'HURT' ||
      demon.state === 'DODGE' ||
      demon.state === 'ATTACK_WINDUP' ||
      demon.state === 'BDA_CAST' ||
      demon.state === 'LIGHT_ATTACK' ||
      demon.state === 'HEAVY_ATTACK'
    ) {
      return null;
    }

    const aliveTargets = targets.filter((t) => t.hp > 0);
    if (aliveTargets.length === 0) {
      demon.state = 'IDLE';
      demon.vx = 0;
      return null;
    }

    let target = aliveTargets[0];
    let bestDist = Math.abs(target.x - demon.x);
    for (let i = 1; i < aliveTargets.length; i++) {
      const d = Math.abs(aliveTargets[i].x - demon.x);
      if (d < bestDist) {
        bestDist = d;
        target = aliveTargets[i];
      }
    }

    const paceDt = dt * chillFactor * (demon.bossPhase === 3 ? 1.22 : demon.bossPhase === 2 ? 1.1 : 1.0);
    this.attackCooldown = Math.max(0, this.attackCooldown - paceDt);
    this.decisionCooldown = Math.max(0, this.decisionCooldown - paceDt);
    this.bdaCooldown = Math.max(0, this.bdaCooldown - paceDt);
    this.ultimateCooldown = Math.max(0, this.ultimateCooldown - paceDt);
    this.cloneCooldown = Math.max(0, this.cloneCooldown - dt);
    this.defenseCooldown = Math.max(0, this.defenseCooldown - dt);
    this.strafeTimer = Math.max(0, this.strafeTimer - dt);

    const dx = target.x - demon.x;
    const absDx = Math.abs(dx);
    demon.facing = dx >= 0 ? 1 : -1;

    const isMuzanTier =
      arch === 'boss_muzan' || arch === 'muzan_final' || arch === 'demon_king_tanjiro';
    if (target.state === 'RAGDOLL' && absDx < 160 && !isMuzanTier) {
      demon.state = 'IDLE';
      demon.vx *= 0.85;
      return null;
    }

    // Strategic defensive reactions when player swings Heavy or Breathing Form nearby
    const incomingThreat =
      target.state === 'HEAVY_ATTACK' ||
      target.state === 'BREATHING_FORM' ||
      target.state === 'RUNNING_ATTACK';
    if (incomingThreat && absDx < 165 && this.defenseCooldown <= 0) {
      if (Math.random() < specDb.dodgeChance) {
        demon.state = 'DODGE';
        demon.stateTimer = 0;
        demon.invulnTimer = 0.24;
        demon.vx = -demon.facing * (specDb.canTeleport ? 660 : 540);
        this.defenseCooldown = 1.9;
        sound.playDodge();
        return null;
      } else if (specDb.canBlock && Math.random() < 0.45) {
        demon.state = 'BLOCK';
        demon.stateTimer = 0;
        demon.vx = 0;
        this.defenseCooldown = 1.6;
        return null;
      }
    } else if (demon.state === 'BLOCK' && !incomingThreat) {
      demon.state = 'IDLE';
    }

    // Clone / subordinate spawning (Doma, Hantengu, Rui)
    if (
      allowCloneSpawn &&
      specDb.cloneArchetype &&
      this.cloneCooldown <= 0 &&
      hpRatio < 0.82
    ) {
      this.cloneCooldown = 14.5;
      sound.playDemonAttackSound(specDb.sfxTheme, true);
      this.setTelegraph(specDb.ultimateText, 1.3);
      particles.spawnFloatingText(demon.x, demon.y - 135, 'SUMMONING ALLY!', template.bdaColor, 1.2);
      return {
        spawnCloneArchetype: specDb.cloneArchetype,
        telegraphText: this.activeTelegraph,
      };
    }

    // Teleportation reposition for Nakime / Gyokko / Swamp / Yushiro / Ubume
    if (specDb.canTeleport && absDx < 85 && this.defenseCooldown <= 0 && Math.random() < 0.04) {
      this.defenseCooldown = 3.2;
      const shift = target.x + (target.x > 920 ? -260 : 260);
      sound.playDemonAttackSound(specDb.sfxTheme, false);
      particles.spawnDust(demon.x, demon.y, 10, 0);
      return {
        teleportToX: shift,
        triggerRoomShift: specDb.triggersRoomShift,
      };
    }

    // Jump up if player is elevated on a platform
    if (target.y < demon.y - 75 && demon.grounded && absDx < 220 && Math.random() < 0.045) {
      demon.vy = PLAYER_JUMP_VELOCITY * 0.94;
      demon.grounded = false;
      demon.state = 'JUMP';
    }

    // Ultimate Blood Demon Art cast!
    if (this.ultimateCooldown <= 0 && absDx < 580 && (specDb.phases > 1 || specDb.difficultyTier !== 'Easy')) {
      demon.currentAttack = isMuzanTier
        ? DEMON_ATTACK_SPECS.MUZAN_SHOCKWAVE
        : DEMON_ATTACK_SPECS.DEMON_ULTIMATE;
      demon.state = 'BDA_CAST';
      demon.stateTimer = 0;
      demon.attackSwingId += 1;
      demon.hitTargetsThisSwing.clear();
      demon.vx = 0;
      this.ultimateCooldown = specDb.ultimateCooldown;
      this.bdaCooldown = 2.0;
      this.setTelegraph(specDb.ultimateText, 1.35);
      sound.playDemonAttackSound(specDb.sfxTheme, true);
      particles.spawnFloatingText(demon.x, demon.y - 132, specDb.ultimateText, template.bdaColor, 1.2);

      const projectiles = this.buildProjectiles(demon, template.bdaColor, template.bdaGlow, specDb, true);
      return {
        projectiles,
        projectile: projectiles[0],
        triggerRoomShift: Boolean(specDb.triggersRoomShift),
        telegraphText: this.activeTelegraph,
      };
    }

    // Standard Blood Demon Art cast based on ideal engagement zone
    if (this.bdaCooldown <= 0 && absDx >= Math.max(70, specDb.preferredMinDist * 0.7) && absDx <= 580) {
      const isArea = absDx < 185 && Math.random() < 0.42;
      demon.currentAttack = isArea
        ? isMuzanTier
          ? DEMON_ATTACK_SPECS.MUZAN_SHOCKWAVE
          : DEMON_ATTACK_SPECS.DEMON_BDA_AREA
        : DEMON_ATTACK_SPECS.DEMON_BDA_PROJECTILE;
      demon.state = 'BDA_CAST';
      demon.stateTimer = 0;
      demon.attackSwingId += 1;
      demon.hitTargetsThisSwing.clear();
      demon.vx = 0;
      this.bdaCooldown = specDb.bdaCooldown * (demon.bossPhase === 3 ? 0.72 : demon.bossPhase === 2 ? 0.85 : 1.0);
      sound.playDemonAttackSound(specDb.sfxTheme, false);
      this.setTelegraph(`${template.displayName.split('·')[0].trim()} unleashes Blood Demon Art!`, 0.9);

      if (!isArea) {
        const projectiles = this.buildProjectiles(demon, template.bdaColor, template.bdaGlow, specDb, false);
        return {
          projectiles,
          projectile: projectiles[0],
          triggerRoomShift: Boolean(specDb.triggersRoomShift),
          telegraphText: this.activeTelegraph,
        };
      }
      return {
        triggerRoomShift: Boolean(specDb.triggersRoomShift),
        telegraphText: this.activeTelegraph,
      };
    }

    // Distance management: Ranged casters backpedal if too close; melee beasts rush in
    const moveSpeed = (arch === 'fast' || arch === 'chachamaru' ? 275 : 210) * demon.speedMult * chillFactor;
    if (absDx > specDb.preferredMaxDist) {
      demon.vx = demon.facing * moveSpeed;
      demon.state = moveSpeed > 215 ? 'RUN' : 'WALK';
    } else if (absDx < specDb.preferredMinDist && specDb.preferredMinDist >= 110) {
      demon.vx = -demon.facing * moveSpeed * 0.82;
      demon.state = 'WALK';
    } else if (this.attackCooldown <= 0 && this.decisionCooldown <= 0 && absDx <= Math.max(145, specDb.preferredMaxDist)) {
      const roll = Math.random();
      let spec = DEMON_ATTACK_SPECS.DEMON_CLAW;
      if (isMuzanTier) {
        spec =
          roll < 0.38
            ? DEMON_ATTACK_SPECS.MUZAN_TENTACLE_WHIP
            : roll < 0.68
              ? DEMON_ATTACK_SPECS.MUZAN_SHOCKWAVE
              : DEMON_ATTACK_SPECS.DEMON_PUNCH_COMBO;
      } else if (template.visual.bodyBuild === 'hulk') {
        spec = roll < 0.58 ? DEMON_ATTACK_SPECS.DEMON_HEAVY_SLAM : DEMON_ATTACK_SPECS.DEMON_PUNCH_COMBO;
      } else if (
        specDb.sfxTheme === 'martial' ||
        arch === 'fast' ||
        arch === 'nezuko_awakened' ||
        arch === 'nezuko_adult'
      ) {
        spec =
          roll < 0.48
            ? DEMON_ATTACK_SPECS.DEMON_KICK
            : roll < 0.82
              ? DEMON_ATTACK_SPECS.DEMON_PUNCH_COMBO
              : DEMON_ATTACK_SPECS.DEMON_HEAVY_SLAM;
      } else {
        spec =
          roll < 0.32
            ? DEMON_ATTACK_SPECS.DEMON_HEAVY_SLAM
            : roll < 0.66
              ? DEMON_ATTACK_SPECS.DEMON_KICK
              : DEMON_ATTACK_SPECS.DEMON_CLAW;
      }

      if (specDb.poisonDps && specDb.poisonDps > 0) {
        spec = { ...spec, poisonDps: specDb.poisonDps };
      }

      demon.currentAttack = spec;
      demon.state = 'ATTACK_WINDUP';
      demon.stateTimer = 0;
      demon.attackSwingId += 1;
      demon.hitTargetsThisSwing.clear();
      demon.vx = 0;

      const paceFactor = isMuzanTier ? (demon.bossPhase === 3 ? 0.6 : 0.76) : 1.0;
      this.attackCooldown = (spec.triggersRagdoll ? 1.35 : 0.88) * paceFactor;
      this.decisionCooldown = 0.24 * paceFactor;
      this.setTelegraph(spec.triggersRagdoll ? 'INCOMING HEAVY STRIKE!' : null!, 0.55);
      sound.playDemonTelegraph();
    } else {
      if (this.strafeTimer <= 0) {
        this.strafeDir = absDx < 58 ? (-demon.facing as -1 | 1) : 0;
        this.strafeTimer = 0.25 + Math.random() * 0.25;
      }
      demon.vx = this.strafeDir * 115 * chillFactor;
      demon.state = this.strafeDir === 0 ? 'IDLE' : 'WALK';
    }

    return null;
  }

  private buildProjectiles(
    demon: Fighter,
    color: string,
    glowColor: string,
    specDb: ReturnType<typeof DEMON_ABILITY_DB[DemonArchetype] extends infer T ? () => T : never>,
    isUltimate: boolean
  ): Omit<BdaProjectile, 'id'>[] {
    const kind = isUltimate ? specDb.ultimateKind : specDb.projectileKind;
    const count = isUltimate ? Math.max(2, specDb.multiShotCount) : specDb.multiShotCount;
    const speed = specDb.projectileSpeed * (isUltimate ? 1.15 : 1.0);
    const dmg = Math.round((isUltimate ? 24 : 16) * demon.damageMult);
    const out: Omit<BdaProjectile, 'id'>[] = [];

    for (let i = 0; i < count; i++) {
      const spreadOffset = count === 1 ? 0 : (i - (count - 1) * 0.5) * 85;
      const isSwampOrSpike = kind === 'ground_spike' || kind === 'swamp_pool';
      const isBuddhaOrDragon = kind === 'ice_buddha' || kind === 'wooden_dragon';
      out.push({
        ownerId: demon.id,
        ownerRole: 'demon',
        x: demon.x + demon.facing * (44 + i * 16),
        y: isSwampOrSpike ? demon.y - 6 : demon.y - 64 + spreadOffset * 0.2,
        vx: demon.facing * speed * (1 + i * 0.06),
        vy: kind === 'temari_ball' ? -260 - i * 50 : spreadOffset * 0.65,
        radius: isBuddhaOrDragon ? 32 : isUltimate ? 22 : 15,
        damage: dmg,
        color,
        glowColor,
        life: kind === 'swamp_pool' ? 2.6 : 2.35,
        maxLife: kind === 'swamp_pool' ? 2.6 : 2.35,
        kind,
        triggeredRagdoll: isUltimate || isBuddhaOrDragon || kind === 'compass_wave' || kind === 'vector_arrow',
        bouncesLeft: kind === 'temari_ball' ? (specDb.bounces ?? 3) : 0,
        chillDuration: specDb.chillDuration,
        poisonDps: specDb.poisonDps,
        gravityScale: kind === 'temari_ball' ? 0.55 : 0,
      });
    }
    return out;
  }
}

/**
 * AI Controller for Hashira Allies fighting alongside the player in Level 50 Muzan Battle.
 */
export class HashiraAllyAI {
  private attackCooldown = 0.6;
  private specialCooldown = 2.5;
  private dodgeCooldown = 1.2;

  public update(
    ally: Fighter,
    boss: Fighter,
    player: Fighter,
    dt: number,
    sound: SoundEngine,
    particles: ParticleSystem
  ): void {
    if (ally.hp <= 0 || ally.state === 'DEFEATED') {
      ally.vx = 0;
      return;
    }

    if (
      ally.state === 'RAGDOLL' ||
      ally.state === 'GETTING_UP' ||
      ally.state === 'HURT' ||
      ally.state === 'DODGE' ||
      ally.state === 'LIGHT_ATTACK' ||
      ally.state === 'HEAVY_ATTACK' ||
      ally.state === 'BREATHING_FORM'
    ) {
      return;
    }

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);

    const dx = boss.x - ally.x;
    const absDx = Math.abs(dx);
    ally.facing = dx >= 0 ? 1 : -1;

    if (
      (boss.state === 'ATTACK_WINDUP' || boss.state === 'BDA_CAST') &&
      absDx < 200 &&
      this.dodgeCooldown <= 0
    ) {
      if (Math.random() < 0.6) {
        ally.state = 'DODGE';
        ally.stateTimer = 0;
        ally.vx = -ally.facing * 560;
        ally.invulnTimer = 0.24;
        this.dodgeCooldown = 1.5;
        sound.playDodge();
        return;
      } else {
        ally.state = 'BLOCK';
        ally.vx = 0;
        return;
      }
    }

    const urgentProtect = player.state === 'RAGDOLL' || player.hp < player.maxHp * 0.35;
    const moveSpeed = (urgentProtect ? 330 : 270) * ally.speedMult;

    if (absDx > 115) {
      ally.vx = ally.facing * moveSpeed;
      ally.state = moveSpeed > 280 ? 'RUN' : 'WALK';
    } else if (this.specialCooldown <= 0 && ally.energy >= 30) {
      const formIndex: 1 | 2 | 3 = ally.energy >= 40 ? 3 : 2;
      const spec = buildBreathingAttackSpec(ally.breathingStyle, formIndex, ally.damageMult);
      ally.energy -= formIndex * 10;
      ally.currentAttack = spec;
      ally.state = 'BREATHING_FORM';
      ally.stateTimer = 0;
      ally.attackSwingId += 1;
      ally.hitTargetsThisSwing.clear();
      ally.vx = ally.facing * spec.forwardImpulse;
      this.specialCooldown = 3.6;
      sound.playBreathingStyle(ally.breathingStyle, formIndex);
      particles.spawnBreathingEffect(
        ally.breathingStyle,
        formIndex,
        spec.motionPattern ?? 'forward_surge',
        ally.x,
        ally.y,
        ally.facing,
        spec.range
      );
    } else if (this.attackCooldown <= 0) {
      ally.currentAttack = {
        kind: 'LIGHT_1',
        technique: 'horizontal_slash',
        damage: 14,
        startup: 0.08,
        active: 0.12,
        recovery: 0.14,
        knockbackX: 200,
        knockbackY: -110,
        triggersRagdoll: false,
        hitstop: 0.02,
        range: 112,
        reachY: 92,
        forwardImpulse: 125,
      };
      ally.state = 'LIGHT_ATTACK';
      ally.stateTimer = 0;
      ally.attackSwingId += 1;
      ally.hitTargetsThisSwing.clear();
      ally.vx = ally.facing * 125;
      this.attackCooldown = 0.55;
      sound.playSwordSlash(false);
    } else {
      ally.vx *= 0.8;
      ally.state = 'IDLE';
    }
  }
}
