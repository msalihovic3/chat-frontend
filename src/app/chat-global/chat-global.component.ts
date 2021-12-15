import { Component, OnInit,ElementRef, ViewChild } from '@angular/core';
import {io} from 'socket.io-client';
import {  ActivatedRoute, Router } from '@angular/router';

const SOCKET_ENDPOINT = 'https://test-app1y.herokuapp.com/';
//const SOCKET_ENDPOINT = 'localhost:3000'
@Component({
  selector: 'app-chat-global',
  templateUrl: './chat-global.component.html',
  styleUrls: ['./chat-global.component.scss']
})

export class ChatGlobalComponent implements OnInit {
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  
  socket;
  message:string;
  users: any[]=[];
  username:string;
  userID:string;
  messages:any[]=[];
  privateTo:any=null;
  privateChat:boolean=false;

  constructor(private router: Router,private route: ActivatedRoute) { }

  ngOnInit() {
    this.scrollToBottom();
    this.setupSocketConnection();

    this.socket.on("name", (user) => {
      this.username=user.username;
      this.userID=user.id;
    });

    this.socket.on('message-broadcast', (data) => {
      if(this.privateTo!=null && this.privateTo.username===data.username && this.privateChat===true ){
        if (data) {
          this.messages.push({username:data.username, text:data.message, sender:"No"})
        }
      }else if(this.privateChat===false && data.type==="global"){
        if (data) {
          this.messages.push({username:data.username, text:data.message, sender:"No"})
        }
      }
      //brisanje obavijesti da je korisnik u toku pisanja poruke
      if(document.getElementById(data.username+ " is typing...")!=null){
        document.getElementById(data.username+ " is typing...").remove();
      }
     });
    
    this.socket.emit('chat-users', this.users);

    this.socket.on("users", (users) => {
      users.forEach((user) => {
        if(user.username!=this.username && this.users.find(e=>e.username===user.username)==null){
          this.users.push(user)         
        }       
      });
      if(users.at(-1).username!=this.username){
        this.messages.push({username:"No element p", text:users.at(-1).username+" joined the chat", sender:"X"})
      }
    });

    this.socket.on('typing-message',(username)=>{
        if(this.privateTo!=null && this.privateTo.username===username ){
          this.messages.push({username:"No element p", text:username+" is typing...", sender:"No"})
        }else if (this.privateChat===false){
          this.messages.push({username:"No element p", text:username+" is typing...", sender:"No"})
        }
    });

    this.socket.on('open-private',(user)=>{ 
        if(user.to===this.username){
          document.getElementById(user.from).style.background="#a2c5ce"
          document.getElementById(user.from).style.borderRadius="5px"
        }
    })

    this.socket.on('join-private-mess',(user)=>{ 
      this.messages.push({username:"No element p", text:user+" joined the private chat", sender:"X"})
    })

    this.socket.on('left-private-mess',(user)=>{ 
      this.privateTo=null
      this.messages.push({username:"No element p", text:"user left the private chat", sender:"X"})
    })

    this.socket.on("history-messages",(messages)=>{    
      if(messages.id===this.userID || messages.id===""){
        messages.messages.forEach((data) => {
          if(data.user===this.username){
            this.messages.push({username:"No element p", text:data.text, sender:"Yes"})
          }else{
            this.messages.push({username:data.user, text:data.text, sender:"No"})
          }      
        });
      }
    })
  
    this.socket.on('disconnesctUser',(user)=>{
      document.getElementById(user.username).remove(); 
      this.messages.push({username:"No element p", text:user.username+" left the chat", sender:"X"});
    });
  }

  setupSocketConnection() {
     this.socket = io(SOCKET_ENDPOINT);
  }

  ngAfterViewChecked() {
      this.scrollToBottom();
  }

  scrollToBottom(): void {
      try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      } catch (err) {}
  }

  sendMessage() { 
    console.log(this.message)
    if(this.message!=null && this.message!=="" ){
      var message={
        message: this.message,
        username: this.username,
        userTo:null,
        type:"global"
      }

      if(this.privateTo!=null && this.privateChat==true){  
        //ako se salje privatna poruka potrebno je poslati i ID kome saljemo
        message.type="private"
        message.userTo=this.privateTo.userID
        this.socket.emit('message-private', message);
      }else if(this.privateChat==false){
        this.socket.emit('message', message);
      }

      this.messages.push({username:"No element p", text:this.message, sender:"Yes"})  
      this.message = '';
    }
  }

  startTyping() { 
    if(this.privateTo!=null && this.privateChat===true){ //u privatnom chatu
      this.socket.emit('typing', {username:this.username,id:this.privateTo.userID});
    }else if(this.privateChat===false){ //u globalnom chatu
      this.socket.emit('typing', {username:this.username,id:""});
    }
  }

  openPrivate(userElement) {
    this.privateChat=true;

    if(document.getElementById(userElement).style.color!=="gray"){
      this.privateTo=this.users.find(element=>element.username===userElement)  
      //brise poruke globalnog chata
      if(document.getElementById('chat-list')!==null){
        document.getElementById('chat-list').innerHTML="";
        this.messages=[]
      }  
      //salje zhtjevza privatni chat
      if(document.getElementById(userElement).style.background!=="rgb(162, 197, 206)"){
        this.socket.emit('private',{from:this.username,to:userElement});
      }else{
      //odgovor na zahtjev privatnog chata
        this.socket.emit('join-private',{from:this.username,to:this.privateTo.userID}); 
        this.messages.push({username:"No element p", text:this.privateTo.username + " joined the private chat", sender:"X"})
      }
      document.getElementById(userElement).style.background="#61a5b6"
    }
  }

  openGlobalChat(){

    if(document.getElementById('chat-list')!==null){
      document.getElementById('chat-list').innerHTML="";
      this.messages=[]
    }

    //salje zahtjev da poruke globalnog chata i obavrijestava drugog usera
    this.socket.emit('open-global',{username:this.username,id:this.userID,privateUser:this.privateTo});
    this.privateChat=false;
    this.privateTo=null;
  }

}


