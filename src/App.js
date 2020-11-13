import React, { useEffect, useState } from 'react'
import "./App.css";
import { MyContext } from './utils/AppContext';
import Tabs from './Tabs';
import LoadingOverlay from 'react-loading-overlay';
import Login from './Login';
import NotFound from './NotFoundPage';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import firebase from './firebase';

function App() {
    const [checkBoxes,setCheckboxes] = useState({});
    const [firebaseInitialized,setFirebaseInitialized] = useState(false);
    const [showLoader,setShowLoader] = useState(false);
    const [loadingText,setLoadingText] = useState('');
    const store = useState({
        checkBoxes:{
            get:checkBoxes,
            setCheckboxes,
        },
        loading:{
            get:showLoader,
            set:setShowLoader,
            text:loadingText,
            setLoadingText
        }
    })[0];

    useEffect(()=>{
        firebase.isInitialized()
            .then(val=>{
                setFirebaseInitialized(val);
            })
    },[])

    return firebaseInitialized!== false ? (
    <div className="App">
        <Router>
            <Switch>
                <Route exact path="/login" component={Login}>
                </Route>
                <Route exact path="/private">
                    <LoadingOverlay
                      active={showLoader}
                      spinner
                      text={loadingText}
                      >
                        <MyContext store={store}>
                            <Tabs/>
                        </MyContext>
                    </LoadingOverlay>
                </Route>
                <Route path="/" component={Login}/>
            </Switch>
        </Router>
    </div>
   ) : <h1>loading</h1>;
}

export default App;
