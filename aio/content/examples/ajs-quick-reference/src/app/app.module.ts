// #docregion
import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';

import { AppComponent }  from './app.component';
import { MovieListComponent } from './movie-list.component';
import { AppRoutingModule } from './app-routing.module';
import { StringSafeDatePipe } from './date.pipe';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  declarations: [
    AppComponent,
    MovieListComponent,
    StringSafeDatePipe
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
