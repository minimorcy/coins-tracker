import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import {
    ColorModeService,
    ContainerComponent,
    DropdownComponent,
    DropdownItemDirective,
    DropdownMenuDirective,
    DropdownToggleDirective,
    HeaderComponent,
    HeaderNavComponent,
    ButtonDirective,
    NavItemComponent
} from '@coreui/angular';

import { IconDirective } from '@coreui/icons-angular';
import { GuideModalComponent } from '../../../views/dashboard/guide-modal/guide-modal.component';

@Component({
    selector: 'app-default-header',
    templateUrl: './default-header.component.html',
    imports: [ContainerComponent, IconDirective, HeaderNavComponent, NgTemplateOutlet, DropdownComponent, DropdownToggleDirective, DropdownMenuDirective, DropdownItemDirective, ButtonDirective, GuideModalComponent, NavItemComponent]
})
export class DefaultHeaderComponent extends HeaderComponent {

    private readonly colorModeService = inject(ColorModeService);
    readonly colorMode = this.colorModeService.colorMode;

    readonly colorModes = [
        { name: 'light', text: 'Light', icon: 'cilSun' },
        { name: 'dark', text: 'Dark', icon: 'cilMoon' },
        { name: 'auto', text: 'Auto', icon: 'cilContrast' }
    ];

    readonly icons = computed(() => {
        const currentMode = this.colorMode();
        return this.colorModes.find(mode => mode.name === currentMode)?.icon ?? 'cilSun';
    });

    guideVisible = false;

    toggleGuide() {
        this.guideVisible = !this.guideVisible;
    }

    constructor() {
        super();
    }

}
