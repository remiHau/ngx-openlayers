import {Component, computed, inject} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import * as data from '../../assets/examples-code.json';
import {toSignal} from '@angular/core/rxjs-interop';
import {filter, map} from 'rxjs';
import highlight from 'highlight.js/lib/core';
import sdk from '@stackblitz/sdk';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {CdkCopyToClipboard} from '@angular/cdk/clipboard';

@Component({
  selector: 'app-code-block',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CdkCopyToClipboard
  ],
  template: `
    @if (codeToShow()) {
      <div class="container">
        <div class="actions">
          <button mat-icon-button matTooltip="Copy code" [cdkCopyToClipboard]="rawCode()">
            <mat-icon>content_copy</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Edit in StackBlitz" (click)="openInStackblitz()">
            <mat-icon>open_in_new</mat-icon>
          </button>
        </div>
        <pre>
            <code class="hljs language-typescript" [innerHTML]="codeToShow().value"></code>
        </pre>
      </div>
    }
  `,
  styles: `
    .container {
      position: relative;
    }

    .actions {
      position: absolute;
      right: 0;
      top: 1rem;
      z-index: 2;
      display: flex;
      flex-direction: row;
    }

    button {
      opacity: 0;
      transition: opacity 300ms ease-in-out;
    }

    .container:hover button {
      opacity: 1;
    }

  `
})
export class CodeBlockComponent {
  router = inject(Router);
  allCode = data as Record<string, string>;

  private currentExampleKey = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event: NavigationEnd) => {
        const urlSegments = event.urlAfterRedirects.split('/').filter(Boolean);
        if (urlSegments.length === 2 && urlSegments[0] === 'examples') {
          return urlSegments[1];
        }
        return null;
      }),
    ),
  );

  public rawCode = computed(() => {
    const key = this.currentExampleKey();
    return key && this.allCode[key] ? this.allCode[key] : null;
  });


  public codeToShow = computed(() => {
    const code = this.rawCode();
    if (code) {
      return highlight.highlightAuto(code, ['typescript', 'xml']);
    }
    return null;
  });

  openInStackblitz(): void {
    const key = this.currentExampleKey();
    const exampleCode = this.rawCode();

    if (!key || !exampleCode) {
      return;
    }

    // Find the original class name (e.g., "SimpleComponent") to replace it.
    const classNameMatch = exampleCode.match(/export class (\w+)/);
    if (!classNameMatch || !classNameMatch[1]) {
      console.error('Could not find component class name in the source code.');
      return;
    }
    const originalClassName = classNameMatch[1];

    // Replace the original class name with 'AppComponent' so it can be bootstrapped.
    const finalExampleCode = exampleCode.replace(`export class ${originalClassName}`, 'export class AppComponent');

    // The selector in the StackBlitz index.html should match the one in the component.
    const selectorMatch = exampleCode.match(/selector: '([^']+)'/);
    const selector = selectorMatch ? selectorMatch[1] : 'app-root';
    sdk.openProject(
      {
        title: `NGX-Openlayers: ${key}`,
        description: `Example of ${key} from ngx-openlayers`,
        template: 'angular-cli',
        files: {
          'src/index.html': this.getStackBlitzIndexHtml(selector),
          'src/main.ts': this.getStackBlitzMainTs(),
          'src/styles.css': this.getStackBlitzStylesCss(),
          'src/app/app.component.ts': finalExampleCode,
        },
        dependencies: this.getStackBlitzDependencies(),
      },
      {
        openFile: 'src/app/app.component.ts',
      },
    );
  }

  private getStackBlitzIndexHtml(selector: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>NGX-Openlayers Example</title>
          <base href="/" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" type="image/x-icon" href="favicon.ico" />
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
          <link rel="stylesheet" href="node_modules/ol/ol.css" />
      </head>
        <body class="mat-typography">
          <${selector}></${selector}>
        </body>
      </html>`;
  }

  private getStackBlitzMainTs(): string {
    return `import 'zone.js';
      import { bootstrapApplication } from '@angular/platform-browser';
      import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
      import { AppComponent } from './app/app.component';

      bootstrapApplication(AppComponent, {
        providers: [provideAnimationsAsync()],
      }).catch((err) => console.error(err));
      `;
  }

  private getStackBlitzStylesCss(): string {
    return `
    @import '@angular/material/prebuilt-themes/indigo-pink.css';
      html, body {
        height: 100%;
        width: 100%;
        margin: 0;
        font-family: Roboto, "Helvetica Neue", sans-serif;
      }
    `;
  }

  private getStackBlitzDependencies(): Record<string, string> {
    return {
      '@angular/animations': '^18.0.0',
      '@angular/cdk': '^18.0.0',
      '@angular/common': '^18.0.0',
      '@angular/compiler': '^18.0.0',
      '@angular/core': '^18.0.0',
      '@angular/forms': '^18.0.0',
      '@angular/material': '^18.0.0',
      '@angular/platform-browser': '^18.0.0',
      'ngx-openlayers': 'latest',
      ol: '^10.1.0',
      rxjs: '~7.8.0',
      tslib: '^2.3.0',
      'zone.js': '~0.14.0',
    };
  }
}
