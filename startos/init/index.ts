import { actions } from '../actions'
import { restoreInit } from '../backups'
import { setDependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { sdk } from '../sdk'
import { versionGraph } from '../versions'
import { seedFiles } from './seedFiles'
import { watchSetup } from './watchSetup'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  seedFiles,
  setInterfaces,
  setDependencies,
  actions,
  watchSetup,
)

export const uninit = sdk.setupUninit(versionGraph)
