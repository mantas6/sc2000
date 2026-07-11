import type { Tab } from '../game/types'
import { common } from './common'
import { work } from './work'
import { training } from './training'
import { clothing } from './clothing'
import { food } from './food'
import { drink } from './drink'
import { investment } from './investment'
import { chems } from './chems'
import { black } from './black'
import { medical } from './medical'
import { bribe } from './bribe'
import { et } from './et'
import { research } from './research'

/**
 * Ordered list of all 13 category tabs, matching the `ul.nav.nav-tabs` order
 * in the original index.jade (Common Actions → Research).
 *
 * Tabs carrying a `money="-N"` attribute on their nav link in the original are
 * modelled with a one-time `unlockCost` (positive fee) per the TODO decision
 * "Tab entry fees → one-time unlock".
 */
export const tabs: Tab[] = [
  common,
  work,
  training,
  clothing,
  food,
  drink,
  investment,
  chems,
  black,
  medical,
  bribe,
  et,
  research,
]

export {
  common,
  work,
  training,
  clothing,
  food,
  drink,
  investment,
  chems,
  black,
  medical,
  bribe,
  et,
  research,
}
