import React from 'react';

import guardianIcon from '../images/guardian_20px.png';
import dragonhunterIcon from '../images/dragonhunter_20px.png';
import firebrandIcon from '../images/firebrand_20px.png';
import willbenderIcon from '../images/willbender_20px.png';

import revenantIcon from '../images/revenant_20px.png';
import heraldIcon from '../images/herald_20px.png';
import renegadeIcon from '../images/renegade_20px.png';
import vindicatorIcon from '../images/vindicator_20px.png';

import warriorIcon from '../images/warrior_20px.png';
import berserkerIcon from '../images/berserker_20px.png';
import spellbreakerIcon from '../images/spellbreaker_20px.png';
import bladeswornIcon from '../images/bladesworn_20px.png';

import engineerIcon from '../images/engineer_20px.png';
import scrapperIcon from '../images/scrapper_20px.png';
import holosmithIcon from '../images/holosmith_20px.png';
import mechanistIcon from '../images/mechanist_20px.png';

import rangerIcon from '../images/ranger_20px.png';
import druidIcon from '../images/druid_20px.png';
import soulbeastIcon from '../images/soulbeast_20px.png';
import untamedIcon from '../images/untamed_20px.png';

import thiefIcon from '../images/thief_20px.png';
import daredevilIcon from '../images/daredevil_20px.png';
import deadeyeIcon from '../images/deadeye_20px.png';
import specterIcon from '../images/specter_20px.png';

import elementalistIcon from '../images/elementalist_20px.png';
import tempestIcon from '../images/tempest_20px.png';
import weaverIcon from '../images/weaver_20px.png';
import catalystIcon from '../images/catalyst_20px.png';

import mesmerIcon from '../images/mesmer_20px.png';
import chronomancerIcon from '../images/chronomancer_20px.png';
import mirageIcon from '../images/mirage_20px.png';
import virtuosoIcon from '../images/virtuoso_20px.png';

import necromancerIcon from '../images/necromancer_20px.png';
import reaperIcon from '../images/reaper_20px.png';
import scourgeIcon from '../images/scourge_20px.png';
import harbingerIcon from '../images/harbinger_20px.png';

const icons: {
  [index: string]: string
} = {
  guardianIcon,
  dragonhunterIcon,
  firebrandIcon,
  willbenderIcon,

  revenantIcon,
  heraldIcon,
  renegadeIcon,
  vindicatorIcon,

  warriorIcon,
  berserkerIcon,
  spellbreakerIcon,
  bladeswornIcon,

  engineerIcon,
  scrapperIcon,
  holosmithIcon,
  mechanistIcon,

  rangerIcon,
  druidIcon,
  soulbeastIcon,
  untamedIcon,

  thiefIcon,
  daredevilIcon,
  deadeyeIcon,
  specterIcon,

  elementalistIcon,
  tempestIcon,
  weaverIcon,
  catalystIcon,

  mesmerIcon,
  chronomancerIcon,
  mirageIcon,
  virtuosoIcon,

  necromancerIcon,
  reaperIcon,
  scourgeIcon,
  harbingerIcon,
};



export default function SpecIcon(props: any) {
  const { spec, title } = props;

  const icon: string|undefined = icons[spec.toLowerCase() + 'Icon'];

  return (
    <img alt={`${spec} spec icon`} title={title} width="20" height="20" src={icon} />
  );
}


