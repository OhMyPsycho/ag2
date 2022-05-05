import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

declare var gapi: any;
declare var google: any;

interface Email {
  id: string;
  from: string;
  subject: string;
  date: string;
  body: any;
  // reply: string;
}

interface SendMail {
  to: string;
  subject: string;
  message: string;
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {

  clientId = '105624307430-fk933bq6mo70j89e1skni104k8lau9po.apps.googleusercontent.com'
  scopes = 'profile https://www.googleapis.com/auth/gmail.readonly'
  apiKey = 'AIzaSyDB8rpbH9BwJd6Dft0V-HanrvN7s915C7E';
  title = 'ag2';
  listOfData: Email[] = [];
  displayedColumns: string[] = ['From', 'Subject', 'Date'];
  isLoading = false;
  htmlBody: any = '';
  isVisibleFrom: boolean = true;
  form: SendMail = {
    message: "",
    to: '',
    subject: ''
  };

  constructor(private ref: ChangeDetectorRef) {

  }

  ngOnInit(): void {
    this.listOfData = [];
    
    this.isLoading = true;
    this.ref.detach();
    setInterval(() => {
      this.ref.detectChanges();
    }, 3000)
    gapi.load('client', this.initializeGapi)
  }

  initializeGapi = () => {
    gapi.client.init({
      'apiKey': 'AIzaSyDB8rpbH9BwJd6Dft0V-HanrvN7s915C7E',
      'discoveryDocs': ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
      'clientId': '105624307430-fk933bq6mo70j89e1skni104k8lau9po.apps.googleusercontent.com',
      'scope': 'profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
    }).then(() => {
      // gapi.client.setApiKey(this.apiKey);
      this.isLoading = false;
      console.log(gapi.client.getToken())
      console.log(gapi.auth2.getAuthInstance().currentUser.get());
      if(gapi.client.getToken() !== null) {
        this.loadGmailApi()
      }
      console.log("ready")
      // this.checkAuth();
    }).catch((error: any) => {
      console.log(error)
    })
  }

  checkAuth = () => {
    gapi.auth.authorize({
      client_id: this.clientId,
      scope: this.scopes,
      immediate: false
    }, this.handleAuthResult);
  }

  handleAuthResult = (authResult: any) => {
    if(authResult && !authResult.error) {
      this.loadGmailApi()
    } 
    // else {
    //   this.checkAuth()
    // }
    // window.localStorage.setItem('usertoken', JSON.stringify(authResult));
    console.log(authResult)
  }

  loadGmailApi = () => {
    gapi.client.load('gmail', 'v1', this.displayInbox);
  }

  displayInbox = () => {
    let requets = gapi.client.gmail.users.messages.list({
      'userId': 'me',
      'labelIds': 'INBOX',
      'maxResults': 10
    });
    requets.execute((response: any) => {
      response.messages.forEach((m: any) => {
        let messageRequest = gapi.client.gmail.users.messages.get({
          'userId': 'me',
          'id': m.id
        });
        messageRequest.execute(this.appendMessageRow);
      });
    })
    console.log("displayInbox")
  }

  appendMessageRow = (message: any) => {
    this.listOfData.push({
      id: message.id, 
      from: this.getHeader(message.payload.headers, 'From'), 
      subject: this.getHeader(message.payload.headers, 'Subject'),
      date: this.getHeader(message.payload.headers, 'Date'),
      body: this.getBody(message.payload)
    })
    console.log(this.listOfData)
  }


  getHeader = (headers: any, index: string): string => {
    let header = '';
    headers.forEach((e: any) => {
      if(e.name.toLowerCase() === index.toLowerCase()) {
        header = e.value;
      }
    });
    return header;
  }

  getBody = (message: any) => {
    var encodedBody = '';
    if(typeof message.parts === 'undefined')
    {
      encodedBody = message.body.data;
    }
    else
    {
      encodedBody = this.getHTMLPart(message.parts);
    }
    encodedBody = encodedBody.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    return decodeURIComponent(escape(window.atob(encodedBody)));
  }

  getHTMLPart = (arr: any): any => {
    for(var x = 0; x <= arr.length; x++)
    {
      if(typeof arr[x].parts === 'undefined')
      {
        if(arr[x].mimeType === 'text/html')
        {
          return arr[x].body.data;
        }
      }
      else
      {
        return this.getHTMLPart(arr[x].parts);
      }
    }
    return '';
  }

  // mostrar mensaje 
  showDialog = (body: any) => {
    this.htmlBody = body;
    // console.log(body)
  }

  submit = () => {
    console.log(this.form)
    this.sendMessage({
      'To': this.form.to,
      'Subject': this.form.subject,
    }, this.form.message)
  }

  sendMessage = (headers_obj: any, message: string) => {
    var email = '';

    for(var header in headers_obj)
      email += header += ": "+headers_obj[header]+"\r\n";

    email += "\r\n" + message;

    var sendRequest = gapi.client.gmail.users.messages.send({
      'userId': 'me',
      'resource': {
        'raw': window.btoa(email).replace(/\+/g, '-').replace(/\//g, '_')
      }
    });

    return sendRequest.execute(() => console.log("send"));
  }

  // handleSignoutClick = () => {
  //   const token = gapi.client.getToken();
  //   if (token !== null) {
  //     google.accounts.oauth2.revoke(token.access_token);
  //     gapi.client.setToken(null);
  //   }
  // }

}


// @Component({
//   selector: 'dialog-content-example-dialog',
//   templateUrl: './dialog-content-example-dialog.html',
// })
// export class DialogContentExampleDialog {}