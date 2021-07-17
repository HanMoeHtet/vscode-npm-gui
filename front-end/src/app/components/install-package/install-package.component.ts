import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { LoadingScreenService } from 'src/app/services/loading-screen/loading-screen.service';
import { Project } from '../../../../../src/models/project.model';
import { SearchPackageResult } from '../../../../../src/models/nuget.model';
import { DropDownKeyValue } from 'src/app/models/drop-down-key-value';
import { CommandResult } from 'src/app/models/command-result';

declare var command: any;

@Component({
  selector: 'app-install-package',
  templateUrl: './install-package.component.html',
  styleUrls: ['./install-package.component.scss']
})
export class InstallPackageComponent implements AfterViewInit {

  constructor(private loading: LoadingScreenService, private cd: ChangeDetectorRef) { }

  installForm: FormGroup = new FormGroup({
    ProjectIndex: new FormControl('', [])
  })
  pageNumber: number = 1;
  totalHits: number = 0;
  itemsPerPage: number = 10;
  projectList: DropDownKeyValue[] = [];

  ngAfterViewInit(): void {
    this.getData();
  }

  getData() {
    this.loading.startLoading();
    command('nugetpackagemanagergui.reload', { LoadVersion: false }, (res: CommandResult<Project[]>) => {

      this.projectList = res.result.map(proj => ({
        Key: proj.id.toString(),
        Value: proj.projectName
      }));

      this.loading.stopLoading();
      this.cd.detectChanges();
    });
  }
  searchValue: string = "";
  packages: SearchPackageResult = { data: [], totalHits: 0 };
  searchPackage() {
    this.loading.startLoading();
    const skip = (this.pageNumber - 1) * this.itemsPerPage;
    const take = this.itemsPerPage;

    command('nugetpackagemanagergui.searchPackage', {
      Query: this.searchValue.trim(),
      Skip: skip,
      Take: take
    }, (response: CommandResult<SearchPackageResult>) => {
      this.loading.stopLoading();
      this.packages = response.result;
      this.totalHits = this.packages.totalHits!;
      if (this.searchValue.trim() == "") {
        this.totalHits = this.packages.totalHits = 20000;
      }
      this.itemsPerPage = this.packages.data.length == 0 ? 10 : this.packages.data.length;

      this.cd.detectChanges();
    });
  }

  onSearch() {
    this.pageNumber = 1;
    this.totalHits = 0;
    this.itemsPerPage = 10;
    this.searchPackage();
  }

  pageChanged(pageNumber: number) {
    this.pageNumber = pageNumber;
    this.searchPackage();
  }
  packageListVersion: Record<string, string> = {};
  change(packageName: string, value: any) {
    this.packageListVersion[packageName] = value;
  }

  install(packageName: string) {
    const selectedVersion = this.packageListVersion[packageName];
    const projectID = this.installForm.controls["ProjectIndex"].value;
    if (projectID) {
      command('nugetpackagemanagergui.installPackage', { ID: parseInt(projectID), PackageName: packageName, SelectedVersion: selectedVersion }, function () {
      });
    } else {
      command('nugetpackagemanagergui.showMessage', { Message: "The target project isn't selected, select your target project from the drop-down beside the 'search' button.", Type: "error" }, function () { })
    }
  }

}
