/**
 * 武器特效系统
 * 为不同武器提供独特的视觉和机制特效
 */
class WeaponEffectSystem {
  constructor() {
    this.effectTypes = {
      'none': this.effectNone,
      'multi_hit': this.effectMultiHit,
      'aoe_damage': this.effectAOE,
      'crit_boost': this.effectCritBoost,
      'combo_accumulate': this.effectComboAccumulate
    };
  }

  /**
   * 执行武器特效
   */
  executeEffect (weapon, context) {
    if (!weapon.effect || !weapon.effect.type) {
      return { damage: 0, effects: [] };
    }

    const effectFunc = this.effectTypes[weapon.effect.type];
    if (effectFunc) {
      return effectFunc.call(this, weapon, context);
    }

    return { damage: 0, effects: [] };
  }

  /**
   * 无特效
   */
  effectNone (weapon, context) {
    return { damage: 0, effects: [] };
  }

  /**
   * 多段打击特效
   * 例：机械键盘 - 20% 概率额外打击 2 次，每次为主伤害 50%
   */
  effectMultiHit (weapon, context) {
    const { damage, baseDamage, isCrit } = context;

    if (Math.random() > weapon.effect.proc) {
      return { damage: 0, effects: [] };
    }

    const extraHits = weapon.effect.count || 2;
    const scale = weapon.effect.damageScale || 0.5;
    const extraDamage = Math.floor(baseDamage * scale * extraHits);

    return {
      damage: extraDamage,
      effects: [
        {
          type: 'multi_hit_animation',
          count: extraHits,
          scale: scale,
          text: `连续 ${extraHits} 击！`
        }
      ]
    };
  }

  /**
   * AOE 范围伤害特效
   * 例：炸弹武器 - 15% 概率造成范围伤害
   */
  effectAOE (weapon, context) {
    const { damage, baseDamage } = context;

    if (Math.random() > weapon.effect.proc) {
      return { damage: 0, effects: [] };
    }

    const aoeDamage = Math.floor(baseDamage * weapon.effect.scale);

    return {
      damage: aoeDamage,
      effects: [
        {
          type: 'aoe_explosion',
          radius: weapon.effect.radius || 200,
          scale: weapon.effect.scale,
          text: '范围爆炸！'
        }
      ]
    };
  }

  /**
   * 暴击增强特效
   * 例：闪电武器 - 暴击时伤害提升额外 50%
   */
  effectCritBoost (weapon, context) {
    const { damage, isCrit } = context;

    if (!isCrit || Math.random() > weapon.effect.proc) {
      return { damage: 0, effects: [] };
    }

    const boost = Math.floor(damage * weapon.effect.scale);

    return {
      damage: boost,
      effects: [
        {
          type: 'crit_boost_glow',
          scale: weapon.effect.scale,
          text: '暴击增强！'
        }
      ]
    };
  }

  /**
   * 连击积累特效
   * 例：火箭 - 连击数越高，伤害加成越大（最高 3 倍）
   */
  effectComboAccumulate (weapon, context) {
    const { damage, comboCount } = context;

    const maxScale = weapon.effect.maxScale || 3;
    const scale = Math.min(1 + (comboCount / 50) * (maxScale - 1), maxScale);
    const extraDamage = Math.floor(damage * (scale - 1));

    return {
      damage: extraDamage,
      effects: [
        {
          type: 'combo_accumulate_visual',
          scale: scale,
          text: `连击加成 ×${scale.toFixed(2)}`
        }
      ]
    };
  }
}

module.exports = WeaponEffectSystem;
