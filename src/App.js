import React, { useState } from 'react'
import './App.css';
import { MyContext } from './utils/AppContext';
import Tabs from './Tabs';
import LoadingOverlay from 'react-loading-overlay';

function App() {
    const [checkBoxes,setCheckboxes] = useState({});
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

    return (
    <div className="App">
        <LoadingOverlay
          active={showLoader}
          spinner
          text={loadingText}
          >
            <MyContext store={store}>
                <Tabs/>
            </MyContext>
        </LoadingOverlay>
    </div>
  );
}

export default App;
