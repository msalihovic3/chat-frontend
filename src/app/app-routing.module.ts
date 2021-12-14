import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatGlobalComponent } from './chat-global/chat-global.component';


const routes: Routes = [
  {path:'',component: ChatGlobalComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
