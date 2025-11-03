import './App.css'
import SerialProvider from '@/api/serial/SerialProvider'
import MspProvider from '@/api/msp/MspProvider'
import BoardInfoProvider from '@/api/BoardInfoProvider'
import Layout from '@/component/Layout'
import { Route, Switch, Router } from 'wouter'
import {
  HardwareTab, InputTab, OutputTab, StatusTab, GpsTab,
  TesterTab, TuningTab, SensorsTab, ConfigurationTab,
  MixerTab, ModesTab, LoggingTab, FlashTab, BatteryTab
} from './component/tab'

// https://blog.logrocket.com/react-hook-form-vs-react-19/
// https://react.dev/learn/you-might-not-need-an-effect

const App = () => {
  return (
    <SerialProvider>
      <MspProvider>
        <BoardInfoProvider>
          <Router base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
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
                <Route path="/battery"><BatteryTab /></Route>
                <Route path="/gps"><GpsTab /></Route>
                <Route path="/logging"><LoggingTab /></Route>
                <Route path="/cli"><TesterTab /></Route>
                <Route path="/flash"><FlashTab /></Route>
                <Route><h1>Not Found!</h1></Route>
              </Switch>
            </Layout>
          </Router>
        </BoardInfoProvider>
      </MspProvider>
    </SerialProvider>
  )
}

export default App
