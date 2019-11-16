import app from 'firebase/app'
import 'firebase/auth'

const  config = {
    apiKey: "AIzaSyCfM_AbpFLETjiwHfh48XIXLfXQclDk8-o",
    authDomain: "earthquake-pattern.firebaseapp.com",
    databaseURL: "https://earthquake-pattern.firebaseio.com",
    projectId: "earthquake-pattern",
    storageBucket: "earthquake-pattern.appspot.com",
    messagingSenderId: "96688289289",
    appId: "1:96688289289:web:377b13d7c598269c0aead8"
  };

class Firebase {
	constructor() {
		app.initializeApp(config)
		this.auth = app.auth()
	}

	login(email, password) {
		return this.auth.signInWithEmailAndPassword(email, password)
	}

	logout() {
		return this.auth.signOut()
	}


	isInitialized() {
		return new Promise(resolve => {
			this.auth.onAuthStateChanged(resolve)
		})
	}
    getCurrentUseId() {
    		 return  this.auth.currentUser && this.auth.currentUser.uid;
    	}


}
export default new Firebase();
