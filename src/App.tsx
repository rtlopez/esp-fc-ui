import './App.css'
import SerialProvider from '@/api/serial/SerialProvider'
import MspProvider from '@/api/msp/MspProvider'
import BoardInfoProvider from '@/api/BoardInfoProvider'
import Layout from '@/component/Layout'
import { Route, Switch } from 'wouter'
import {
  HardwareTab, InputTab, OutputTab, StatusTab,
  TesterTab, TuningTab, SensorsTab, ConfigurationTab,
  MixerTab, ModesTab
} from './component/tab'

const App = () => {
  return (
    <SerialProvider>
      <MspProvider>
        <BoardInfoProvider>
          <Layout>
            <Switch>
              <Route path="/"><StatusTab /></Route>
              <Route path="/hardware"><HardwareTab /></Route>
              <Route path="/sensors"><SensorsTab /></Route>
              <Route path="/input"><InputTab /></Route>
              <Route path="/output"><OutputTab /></Route>
              <Route path="/mixer"><MixerTab /></Route>
              <Route path="/configuration"><ConfigurationTab /></Route>
              <Route path="/tuning"><TuningTab /></Route>
              <Route path="/modes"><ModesTab /></Route>
              <Route path="/cli"><TesterTab /></Route>
              <Route><h1>Tab Not Found!</h1></Route>
            </Switch>
          </Layout>
        </BoardInfoProvider>
      </MspProvider>
    </SerialProvider>
  )
}

export default App
