import './App.css'
import SerialProvider from '@/api/serial/SerialProvider'
import MspProvider from '@/api/msp/MspProvider'
import Layout from '@/component/Layout'
import { Route, Switch } from 'wouter'
import { HardwareTab, InputTab, OutputTab, StatusTab, TesterTab, TuningTab } from './component/tab'

const App = () => {
  return (
    <SerialProvider>
      <MspProvider>
        <Layout>
          <Switch>
            <Route path="/"><StatusTab /></Route>
            <Route path="/hardware"><HardwareTab /></Route>
            <Route path="/input"><InputTab /></Route>
            <Route path="/output"><OutputTab /></Route>
            <Route path="/tuning"><TuningTab /></Route>
            <Route path="/cli"><TesterTab /></Route>
            <Route><h1>Tab Not Found!</h1></Route>
          </Switch>
        </Layout>
      </MspProvider>
    </SerialProvider>
  )
}

export default App
