import { SoundEngine } from './audio';
import { buildBreathingAttackSpec } from './breathing';
import { BASE_ATTACK_SPECS, DEMON_ATTACK_SPECS, PLAYER_JUMP_VELOCITY } from './constants';
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
  private decisionCooldown = 0.35;
  private attackCooldown = 0.72;
  private bdaCooldown = 2.2;
  private ultimateCooldown = 8.0;
  private cloneCooldown = 8.5;
  private defenseCooldown = 1.4;
  private strafeDir: -1 | 0 | 1 = 0;
  private strafeTimer = 0;
  private activeTelegraph: string | null = null;
  private telegraphTimer = 0;
  private comboCounter = 0;

  public reset(): void {
    this.decisionCooldown = 0.35;
    this.attackCooldown = 0.72;
    this.bdaCooldown = 2.1;
    this.ultimateCooldown = 8.0;
    this.cloneCooldown = 7.5;
    this.defenseCooldown = 1.3;
    this.strafeDir = 0;
    this.strafeTimer = 0;
    this.activeTelegraph = null;
    this.telegraphTimer = 0;
    this.comboCounter = 0;
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
    allowCloneSpawn = true,
    isEngaged = true
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

    if (!isEngaged) {
      demon.vx *= 0.85;
      if (Math.abs(demon.vx) < 5) demon.vx = 0;
      demon.state = 'IDLE';
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
      sound.setBossPhaseIntensity(3);
      this.setTelegraph(`${template.displayName.split('·')[0].trim()} · PHASE III FRENZY!`, 1.5);
      particles.spawnFloatingText(demon.x, demon.y - 135, 'FINAL FRENZY PHASE III!', template.bdaColor, 1.35);
    } else if (specDb.phases >= 2 && hpRatio <= 0.65 && demon.bossPhase < 2) {
      demon.bossPhase = 2;
      sound.playTransformation();
      sound.setBossPhaseIntensity(2);
      this.setTelegraph(`${template.displayName.split('·')[0].trim()} · AWAKENED PHASE II`, 1.25);
      particles.spawnFloatingText(demon.x, demon.y - 135, 'AWAKENED PHASE II!', template.bdaColor, 1.25);
    }

    // Demon cellular regeneration (paused while staggered in ragdoll or poisoned)
    if (template.regenPerSec > 0 && demon.state !== 'RAGDOLL' && demon.poisonTimer <= 0) {
      demon.regenTimer += dt;
      if (demon.regenTimer >= 1.0) {
        demon.regenTimer = 0;
        const heal = Math.round(
          template.regenPerSec * (demon.bossPhase === 3 ? 1.45 : demon.bossPhase === 2 ? 1.2 : 1)
        );
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

    const paceDt = dt * chillFactor * (demon.bossPhase === 3 ? 1.26 : demon.bossPhase === 2 ? 1.12 : 1.0);
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

    const isAkaza = arch === 'boss_akaza' || arch === 'akaza_awakened';
    const isDoma = arch === 'boss_doma' || arch === 'doma_ice_clone' || arch === 'doma_final';
    const isKokushibo = arch === 'boss_kokushibo' || arch === 'kokushibo_demon';
    const isGyutaro = arch === 'gyutaro' || arch === 'gyutaro_awakened';
    const isRui = arch === 'boss_rui' || arch === 'rui_brother' || arch === 'spider_brother_main';
    const isNakime = arch === 'boss_nakime';
    const isMuzanTier =
      arch === 'boss_muzan' || arch === 'muzan_final' || arch === 'demon_king_tanjiro';

    if (target.state === 'RAGDOLL' && absDx < 155 && !isMuzanTier && !isAkaza) {
      demon.state = 'IDLE';
      demon.vx *= 0.85;
      return null;
    }

    // Strategic defensive reactions
    const incomingThreat =
      target.state === 'HEAVY_ATTACK' ||
      target.state === 'BREATHING_FORM' ||
      target.state === 'RUNNING_ATTACK' ||
      target.state === 'COUNTER_ATTACK';

    if (incomingThreat && absDx < 175 && this.defenseCooldown <= 0) {
      const dodgeProb = isAkaza ? Math.min(0.75, specDb.dodgeChance + 0.25) : specDb.dodgeChance;
      if (Math.random() < dodgeProb) {
        demon.state = 'DODGE';
        demon.stateTimer = 0;
        demon.invulnTimer = isAkaza ? 0.3 : 0.24;
        demon.vx = (isAkaza && Math.random() < 0.4 ? demon.facing : -demon.facing) * (specDb.canTeleport ? 680 : 560);
        this.defenseCooldown = isAkaza ? 1.35 : 1.85;
        sound.playDodge();
        if (isAkaza) {
          this.setTelegraph('COMPASS NEEDLE: SENSING FIGHTING SPIRIT!', 0.85);
          particles.spawnFloatingText(demon.x, demon.y - 122, 'COMPASS EVADE!', '#38bdf8', 0.9);
        }
        return null;
      } else if ((specDb.canBlock || isRui) && Math.random() < (isRui ? 0.65 : 0.45)) {
        demon.state = 'BLOCK';
        demon.stateTimer = 0;
        demon.vx = 0;
        this.defenseCooldown = 1.5;
        if (isRui) {
          particles.spawnFloatingText(demon.x, demon.y - 115, 'STEEL THREAD GUARD', '#fda4af', 0.85);
        }
        return null;
      }
    } else if (demon.state === 'BLOCK' && !incomingThreat) {
      demon.state = 'IDLE';
    }

    // Clone / subordinate spawning (Doma Ice Clones, Hantengu clones, Rui family)
    if (allowCloneSpawn && specDb.cloneArchetype && this.cloneCooldown <= 0 && hpRatio < 0.85) {
      this.cloneCooldown = isDoma ? 12.0 : 14.5;
      sound.playDemonAttackSound(specDb.sfxTheme, true);
      const summonText = isDoma ? 'CRYSTALLINE DIVINE CHILD!' : 'SUMMONING ALLY!';
      this.setTelegraph(summonText, 1.3);
      particles.spawnFloatingText(demon.x, demon.y - 135, summonText, template.bdaColor, 1.2);
      return {
        spawnCloneArchetype: specDb.cloneArchetype,
        telegraphText: this.activeTelegraph,
      };
    }

    // Nakime / Teleportation reposition (stays within current engagement zone around target!)
    if (
      (specDb.canTeleport || isNakime) &&
      ((isNakime && this.bdaCooldown <= 0.4 && Math.random() < 0.06) || (absDx < 90 && this.defenseCooldown <= 0 && Math.random() < 0.05))
    ) {
      this.defenseCooldown = isNakime ? 2.4 : 3.2;
      const offset = Math.random() < 0.5 ? -300 : 300;
      const shift = target.x + offset;
      sound.playDemonAttackSound(specDb.sfxTheme, false);
      particles.spawnDust(demon.x, demon.y, 10, 0);
      if (isNakime) {
        this.setTelegraph('BIWA STRUM · INFINITY ROOM SHIFT!', 1.0);
      }
      return {
        teleportToX: shift,
        triggerRoomShift: Boolean(specDb.triggersRoomShift || isNakime),
        telegraphText: this.activeTelegraph,
      };
    }

    // Jump up if player is elevated on a platform
    if (target.y < demon.y - 75 && demon.grounded && absDx < 240 && Math.random() < 0.055) {
      demon.vy = PLAYER_JUMP_VELOCITY * 0.94;
      demon.grounded = false;
      demon.state = 'JUMP';
    }

    // Ultimate Blood Demon Art cast!
    if (this.ultimateCooldown <= 0 && absDx < 640 && (specDb.phases > 1 || specDb.difficultyTier !== 'Easy')) {
      demon.currentAttack = isMuzanTier
        ? DEMON_ATTACK_SPECS.MUZAN_SHOCKWAVE
        : DEMON_ATTACK_SPECS.DEMON_ULTIMATE;
      demon.state = 'BDA_CAST';
      demon.stateTimer = 0;
      demon.attackSwingId += 1;
      demon.hitTargetsThisSwing.clear();
      demon.vx = 0;
      this.ultimateCooldown = specDb.ultimateCooldown * (demon.bossPhase >= 2 ? 0.85 : 1.0);
      this.bdaCooldown = 1.9;
      this.setTelegraph(specDb.ultimateText, 1.4);
      sound.playDemonAttackSound(specDb.sfxTheme, true);
      particles.spawnFloatingText(demon.x, demon.y - 135, specDb.ultimateText, template.bdaColor, 1.25);

      const projectiles = this.buildProjectiles(demon, template.bdaColor, template.bdaGlow, specDb, true);
      return {
        projectiles,
        projectile: projectiles[0],
        triggerRoomShift: Boolean(specDb.triggersRoomShift),
        telegraphText: this.activeTelegraph,
      };
    }

    // Standard Blood Demon Art cast based on archetype fighting style
    if (this.bdaCooldown <= 0 && absDx >= Math.max(60, specDb.preferredMinDist * 0.65) && absDx <= 600) {
      const preferArea = isAkaza ? absDx < 165 : isDoma ? absDx < 210 : absDx < 185;
      const isArea = preferArea && Math.random() < (isDoma ? 0.35 : 0.45);
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
      this.bdaCooldown = specDb.bdaCooldown * (demon.bossPhase === 3 ? 0.68 : demon.bossPhase === 2 ? 0.84 : 1.0);
      sound.playDemonAttackSound(specDb.sfxTheme, false);

      const bdaBanner = isAkaza
        ? 'DESTRUCTIVE DEATH · AIR TYPE!'
        : isDoma
          ? 'CRYOKINESIS · SCATTERING LOTUSES!'
          : isKokushibo
            ? 'MOON BREATHING · CALAMITOUS CRESCENTS!'
            : isGyutaro
              ? 'FLYING BLOOD SICKLES!'
              : `${template.displayName.split('·')[0].trim()} unleashes Blood Demon Art!`;
      this.setTelegraph(bdaBanner, 0.95);

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

    // Distance management: Ranged casters zone cleanly; Akaza & Kokushibo pressure aggressively
    const baseMove = isAkaza || arch === 'fast' || arch === 'chachamaru' ? 285 : isGyutaro ? 260 : 215;
    const moveSpeed = baseMove * demon.speedMult * chillFactor;

    if (absDx > specDb.preferredMaxDist) {
      demon.vx = demon.facing * moveSpeed;
      demon.state = moveSpeed > 220 ? 'RUN' : 'WALK';
    } else if (absDx < specDb.preferredMinDist && specDb.preferredMinDist >= 110) {
      demon.vx = -demon.facing * moveSpeed * 0.85;
      demon.state = 'WALK';
    } else if (
      this.attackCooldown <= 0 &&
      this.decisionCooldown <= 0 &&
      absDx <= Math.max(150, specDb.preferredMaxDist)
    ) {
      this.comboCounter = (this.comboCounter + 1) % 3;
      const roll = Math.random();
      let spec = DEMON_ATTACK_SPECS.DEMON_CLAW;

      if (isMuzanTier) {
        spec =
          roll < 0.4
            ? DEMON_ATTACK_SPECS.MUZAN_TENTACLE_WHIP
            : roll < 0.7
              ? DEMON_ATTACK_SPECS.MUZAN_SHOCKWAVE
              : DEMON_ATTACK_SPECS.DEMON_PUNCH_COMBO;
      } else if (isAkaza) {
        // Akaza uses crisp martial arts chains: Punch Flurry -> High Kick -> Disorder Ground Slam!
        spec =
          this.comboCounter === 0
            ? DEMON_ATTACK_SPECS.DEMON_PUNCH_COMBO
            : this.comboCounter === 1
              ? DEMON_ATTACK_SPECS.DEMON_KICK
              : DEMON_ATTACK_SPECS.DEMON_HEAVY_SLAM;
      } else if (isKokushibo) {
        spec =
          roll < 0.45
            ? DEMON_ATTACK_SPECS.DEMON_HEAVY_SLAM
            : { ...BASE_ATTACK_SPECS.LIGHT_1, kind: 'LIGHT_1', damage: Math.round(18 * demon.damageMult), range: 132 };
      } else if (isGyutaro) {
        spec =
          roll < 0.65
            ? DEMON_ATTACK_SPECS.DEMON_CLAW
            : DEMON_ATTACK_SPECS.DEMON_KICK;
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

      const paceFactor =
        isMuzanTier || isAkaza || isKokushibo
          ? demon.bossPhase === 3
            ? 0.58
            : demon.bossPhase === 2
              ? 0.72
              : 0.85
          : 1.0;
      this.attackCooldown = (spec.triggersRagdoll ? 1.25 : 0.82) * paceFactor;
      this.decisionCooldown = 0.22 * paceFactor;
      if (spec.triggersRagdoll) {
        this.setTelegraph(isAkaza ? 'COMPASS LEG SPLITTER!' : 'INCOMING HEAVY STRIKE!', 0.55);
      }
      sound.playDemonTelegraph();
    } else {
      if (this.strafeTimer <= 0) {
        this.strafeDir = absDx < 58 ? (-demon.facing as -1 | 1) : 0;
        this.strafeTimer = 0.25 + Math.random() * 0.25;
      }
      demon.vx = this.strafeDir * 125 * chillFactor;
      demon.state = this.strafeDir === 0 ? 'IDLE' : 'WALK';
    }

    return null;
  }

  private buildProjectiles(
    demon: Fighter,
    color: string,
    glowColor: string,
    specDb: (typeof DEMON_ABILITY_DB)[DemonArchetype],
    isUltimate: boolean
  ): Omit<BdaProjectile, 'id'>[] {
    const kind = isUltimate ? specDb.ultimateKind : specDb.projectileKind;
    const phaseBonus = demon.bossPhase >= 3 ? 2 : demon.bossPhase >= 2 ? 1 : 0;
    const count = isUltimate
      ? Math.max(2, specDb.multiShotCount + phaseBonus)
      : Math.max(1, specDb.multiShotCount + (demon.bossPhase >= 2 ? 1 : 0));
    const speed = specDb.projectileSpeed * (isUltimate ? 1.15 : 1.0);
    const dmg = Math.round((isUltimate ? 22 : 14) * demon.damageMult);
    const out: Omit<BdaProjectile, 'id'>[] = [];

    for (let i = 0; i < count; i++) {
      const spreadOffset = count === 1 ? 0 : (i - (count - 1) * 0.5) * 76;
      const isSwampOrSpike = kind === 'ground_spike' || kind === 'swamp_pool';
      const isBuddhaOrDragon = kind === 'ice_buddha' || kind === 'wooden_dragon';
      out.push({
        ownerId: demon.id,
        ownerRole: 'demon',
        x: demon.x + demon.facing * (44 + i * 16),
        y: isSwampOrSpike ? demon.y - 6 : demon.y - 64 + spreadOffset * 0.22,
        vx: demon.facing * speed * (1 + i * 0.05),
        vy: kind === 'temari_ball' ? -260 - i * 50 : spreadOffset * 0.58,
        radius: isBuddhaOrDragon ? 32 : isUltimate ? 21 : 15,
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
 * AI Controller for Canon Allies (Hashira, Squadmates & Nezuko) fighting alongside the player.
 * Supports multi-zone traversal: follows beside the player across large maps when no demon is nearby.
 */
export class HashiraAllyAI {
  private attackCooldown = 0.55;
  private specialCooldown = 2.4;
  private dodgeCooldown = 1.2;

  public update(
    ally: Fighter,
    enemies: Fighter[],
    player: Fighter,
    slotIndex: number,
    dt: number,
    sound: SoundEngine,
    particles: ParticleSystem,
    enemyEngaged: boolean
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

    const aliveEnemies = enemies.filter((e) => e.hp > 0);
    let target = aliveEnemies[0];
    let bestDist = target ? Math.abs(target.x - ally.x) : 99999;
    for (let i = 1; i < aliveEnemies.length; i++) {
      const d = Math.abs(aliveEnemies[i].x - ally.x);
      if (d < bestDist) {
        bestDist = d;
        target = aliveEnemies[i];
      }
    }

    // Exploration Follow Mode when between zones or target is far away
    if (!target || !enemyEngaged || bestDist > 680) {
      const followOffset = -player.facing * (78 + slotIndex * 54);
      const followTargetX = player.x + followOffset;
      const distToFollow = followTargetX - ally.x;
      if (Math.abs(distToFollow) > 42) {
        ally.facing = distToFollow >= 0 ? 1 : -1;
        const followSpeed = Math.abs(distToFollow) > 190 ? 345 : 230;
        ally.vx = ally.facing * followSpeed;
        ally.state = followSpeed > 260 ? 'RUN' : 'WALK';
        // Jump if stuck behind height or player jumped up
        if (player.y < ally.y - 80 && ally.grounded && Math.abs(player.x - ally.x) < 160) {
          ally.vy = PLAYER_JUMP_VELOCITY * 0.95;
          ally.grounded = false;
          ally.state = 'JUMP';
        }
      } else {
        ally.vx *= 0.72;
        ally.facing = player.facing;
        ally.state = 'IDLE';
      }
      return;
    }

    const dx = target.x - ally.x;
    const absDx = Math.abs(dx);
    ally.facing = dx >= 0 ? 1 : -1;

    // Defensive evasion against telegraphed demon attacks
    if (
      (target.state === 'ATTACK_WINDUP' || target.state === 'BDA_CAST') &&
      absDx < 200 &&
      this.dodgeCooldown <= 0
    ) {
      if (Math.random() < 0.62) {
        ally.state = 'DODGE';
        ally.stateTimer = 0;
        ally.vx = -ally.facing * 560;
        ally.invulnTimer = 0.25;
        this.dodgeCooldown = 1.45;
        sound.playDodge();
        return;
      } else {
        ally.state = 'BLOCK';
        ally.vx = 0;
        return;
      }
    }

    const isNezuko = ally.characterId === 'nezuko_ally';
    const urgentProtect = player.state === 'RAGDOLL' || player.hp < player.maxHp * 0.35;
    const moveSpeed = (urgentProtect ? 335 : 275) * ally.speedMult;

    if (absDx > 112) {
      ally.vx = ally.facing * moveSpeed;
      ally.state = moveSpeed > 280 ? 'RUN' : 'WALK';
    } else if (this.specialCooldown <= 0 && ally.energy >= 30) {
      const formIndex: 1 | 2 | 3 = ally.energy >= 40 ? 3 : 2;
      const spec = buildBreathingAttackSpec(ally.breathingStyle, formIndex, ally.damageMult);
      ally.energy -= formIndex * 10;
      ally.currentAttack = isNezuko
        ? {
            ...spec,
            kind: 'BREATHING_3',
            damage: Math.round(24 * ally.damageMult),
          }
        : spec;
      ally.state = 'BREATHING_FORM';
      ally.stateTimer = 0;
      ally.attackSwingId += 1;
      ally.hitTargetsThisSwing.clear();
      ally.vx = ally.facing * spec.forwardImpulse;
      this.specialCooldown = 3.4;
      sound.playBreathingStyle(ally.breathingStyle, formIndex);
      if (isNezuko) {
        particles.spawnFloatingText(ally.x, ally.y - 110, 'EXPLODING BLOOD!', '#fb7185', 1.0);
        particles.spawnBreathingEffect('flame', formIndex, 'dragon_finisher', ally.x, ally.y, ally.facing, spec.range);
      } else {
        particles.spawnBreathingEffect(
          ally.breathingStyle,
          formIndex,
          spec.motionPattern ?? 'forward_surge',
          ally.x,
          ally.y,
          ally.facing,
          spec.range
        );
      }
    } else if (this.attackCooldown <= 0) {
      ally.currentAttack = isNezuko
        ? {
            ...DEMON_ATTACK_SPECS.DEMON_KICK,
            damage: Math.round(15 * ally.damageMult),
            triggersRagdoll: false,
            range: 98,
          }
        : {
            kind: 'LIGHT_1',
            technique: 'horizontal_slash',
            damage: Math.round(14 * ally.damageMult),
            startup: 0.08,
            active: 0.12,
            recovery: 0.14,
            knockbackX: 190,
            knockbackY: -100,
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
      this.attackCooldown = 0.52;
      sound.playSwordSlash(false);
    } else {
      ally.vx *= 0.8;
      ally.state = 'IDLE';
    }
  }
}
