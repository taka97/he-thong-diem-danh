import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { CourseService, StudentService, AttendanceService, AppService, EditScheduleModalComponent,
 ScheduleService, ResultMessageModalComponent, AuthService, ExcelService, ImportModalComponent } from '../../../shared/shared.module';
declare let jQuery: any;
@Component({
    selector: 'course-detail-staff',
    templateUrl: './course-detail-staff.component.html'
})
export class CourseDetailStaffComponent implements OnInit {
    public schedules = [];
    public course_not_found = false;
    public course_id: any;
    public course: Array < any > = [];
    public lecturers: Array < any > = [];
    public TAs: Array < any > = [];
    public class_has_course: Array < any > = [{
        classId: 0,
        class_name: '',
        schedule: '',
        isAddStudentFromCLass: true,
        addStudentFromFile: '',
        studentListFromFile: [],
    }];
    public attendance_lists: Array < any > = [];
    public attendance_list: Array < any > = [];
    public apiResult: string;
    public apiResultMessage: string;
    @ViewChild(ResultMessageModalComponent)
    public  resultMessageModal: ResultMessageModalComponent;

    public constructor(public route: ActivatedRoute, public studentService: StudentService, public  router: Router,
        public  appService: AppService, public  courseService: CourseService, public  attendanceService: AttendanceService,
         public  scheduleService: ScheduleService, public authService: AuthService,public excelService: ExcelService) {}

    public getAttendanceList() {
        var classes_id: Array<number> = [];
        for(var i = 0 ; i < this.class_has_course.length; i++) {
            classes_id.push(this.class_has_course[i].class_id);
        }
        this.attendanceService.getAttendanceListByCourse(this.course_id, classes_id).subscribe(result => {
            this.apiResult = result.result;
            this.attendance_lists = result.attendance_lists;
            this.onChangeClass(0);
            this.cloneAttendanceList(true);
        }, error => { this.appService.showPNotify('failure', 'Server Error! Can\'t get attendance_list', 'error'); });
    }

    public ngOnInit(): void {
        this.route.params.subscribe(params => { this.course_id = params['id']; });
        // get course info
        this.courseService.getCourseDetail(this.course_id).subscribe(result => {
            this.course = result.course;
            this.lecturers = result.lecturers;
            this.TAs = result.TAs;
            this.class_has_course = result.class_has_course;
            if (this.course === undefined || this.course == null) {
                this.course_not_found = true;
            }else {
                // get student list
                this.getAttendanceList();
            }
        }, error => { this.appService.showPNotify('failure', 'Server Error! Can\'t get course detail', 'error'); });
    }

    public onEditCourse() {
        this.router.navigate(['/courses/', this.course_id, 'edit']);
    }

    //Schedule
    @ViewChild(EditScheduleModalComponent)
    public  editScheduleModal: EditScheduleModalComponent;

    public scheduleModal = {
        id: 'scheduleModal',
        title: 'Schedule'
    }
    public onSaveSchedule(schedule: Array < string > ) {
        //this.course.schedule = schedule;
        for (var i = 0; i < this.class_has_course.length; i++) {
            this.class_has_course[i].schedules = schedule[i];
        }
        this.scheduleService.updateSchedule(this.class_has_course).subscribe(result => {
            this.apiResult = result.result;
            this.apiResultMessage = result.message;
            //this.resultMessageModal.onOpenModal();
            this.appService.showPNotify(this.apiResult,this.apiResultMessage,this.apiResult == 'success' ? 'success' : 'error');
        }, error => { this.appService.showPNotify('failure',"Server Error! Can't save schedule",'error');});
    }
    public onOpenSchedule() {
        this.editScheduleModal.onOpenModal();
    }

    public isEdittingAttendance = false;
    public temp_attendance_lists: Array < any > = [];
    public selected_class_index = 0;
    public onChangeClass(index){
        this.selected_class_index = index;
        this.attendance_list = this.attendance_lists[index];
        for(var i = 0; i < this.attendance_list.length;i++){
            for(var j = 0 ; j < this.attendance_list[i].attendance_details.length; j++){
                switch (this.attendance_list[i].attendance_details[j].attendance_type) {
                    case this.appService.attendance_type.checklist:
                        this.attendance_list[i].attendance_details[j]['icon'] = 'fa-check';
                        this.attendance_list[i].attendance_details[j]['method'] = 'Checklist';
                        break;
                    case this.appService.attendance_type.qr:
                        this.attendance_list[i].attendance_details[j]['icon'] = 'fa-qrcode';
                        this.attendance_list[i].attendance_details[j]['method'] = 'QR Code';
                        break;
                    case this.appService.attendance_type.quiz:
                        this.attendance_list[i].attendance_details[j]['icon'] = 'fa-question-circle';
                        this.attendance_list[i].attendance_details[j]['method'] = 'Quiz';
                        break;
                    case this.appService.attendance_type.permited_absent:
                        this.attendance_list[i].attendance_details[j]['icon'] = 'fa-envelope-square';
                        this.attendance_list[i].attendance_details[j]['method'] = 'Permited Absent';
                        break;        
                    default:
                        this.attendance_list[i].attendance_details[j]['icon'] = '';
                        this.attendance_list[i].attendance_details[j]['method'] = 'Absent';
                        break;
                }
            }
        }
    }

    public cloneAttendanceList(isTempDes: boolean) {
        if (isTempDes) {
            console.log('Temp_attendance_lists is destroyed, Cloning attendance lists');
            this.temp_attendance_lists = [];
            for(var k = 0 ; k < this.attendance_lists.length; k++) {
                var temp_attendance_list = [];
                for (var i = 0; i < this.attendance_lists[k].length; i++) {
                    var attendance = {
                        id: this.attendance_lists[k][i].id,
                        code: this.attendance_lists[k][i].code,
                        name: this.attendance_lists[k][i].name,
                        exemption: this.attendance_lists[k][i].exemption,
                        attendance_details: []
                    };
                    for (var j = 0; j < this.attendance_lists[k][i].attendance_details.length; j++) {
                        var attendance_detail = {
                            attendance_id: this.attendance_lists[k][i].attendance_details[j].attendance_id,
                            attendance_type: this.attendance_lists[k][i].attendance_details[j].attendance_type,
                            attendance_time: this.attendance_lists[k][i].attendance_details[j].attendance_time,
                            created_at: this.attendance_lists[k][i].attendance_details[j].created_at,
                            edited_reason: this.attendance_lists[k][i].attendance_details[j].edited_reason,
                            edited_by: this.attendance_lists[k][i].attendance_details[j].edited_by,
                            editor: this.attendance_lists[k][i].attendance_details[j].editor,
                            icon: this.attendance_lists[k][i].attendance_details[j].icon,
                            method: this.attendance_lists[k][i].attendance_details[j].method,
                        };
                        attendance.attendance_details.push(attendance_detail);
                    }
                    temp_attendance_list.push(attendance);
                }
                this.temp_attendance_lists.push(temp_attendance_list);
            }
        } else {
            console.log('Temp_attendance_lists exists, no cloning, pushing temp_lists back to attendance_lists');
            this.attendance_lists = [];
            for (var k = 0; k < this.temp_attendance_lists.length; k++) {
                var attendance_list = [];
                for (var i = 0; i < this.temp_attendance_lists[k].length; i++) {
                    var attendance = {
                        id: this.temp_attendance_lists[k][i].id,
                        code: this.temp_attendance_lists[k][i].code,
                        name: this.temp_attendance_lists[k][i].name,
                        exemption: this.temp_attendance_lists[k][i].exemption,
                        attendance_details: []
                    };
                    for (var j = 0; j < this.temp_attendance_lists[k][i].attendance_details.length; j++) {
                        var attendance_detail = {
                            attendance_id: this.temp_attendance_lists[k][i].attendance_details[j].attendance_id,
                            attendance_type: this.temp_attendance_lists[k][i].attendance_details[j].attendance_type,
                            attendance_time: this.temp_attendance_lists[k][i].attendance_details[j].attendance_time,
                            created_at: this.temp_attendance_lists[k][i].attendance_details[j].created_at,
                            edited_reason: this.temp_attendance_lists[k][i].attendance_details[j].edited_reason,
                            edited_by: this.temp_attendance_lists[k][i].attendance_details[j].edited_by,
                            editor: this.temp_attendance_lists[k][i].attendance_details[j].editor,
                            icon: this.temp_attendance_lists[k][i].attendance_details[j].icon,
                            method: this.temp_attendance_lists[k][i].attendance_details[j].method,
                        };
                        attendance.attendance_details.push(attendance_detail);
                    }
                    attendance_list.push(attendance);
                }
                this.attendance_lists.push(attendance_list);
            }
        }
    }

    public onEditAttendance() {
        this.isEdittingAttendance = true;
        this.cloneAttendanceList(true);
    }
    public onCancelEditAttendance() {
        this.isEdittingAttendance = false;
    }
    public onSaveEditAttendance() {
        // this.cloneAttendanceList(false); // Push temp_lists back to attendance_lists
        console.log('onSaveEditAttendanceClick');
        let classes_id: Array<number> = [];
        for (let i = 0 ; i < this.class_has_course.length; i++) {
            classes_id.push(this.class_has_course[i].class_id);
        }
        this.attendanceService.updateAttendanceListByCourse(this.course_id, classes_id, this.temp_attendance_lists)
        .subscribe(results => {
            if (results.result === 'success') {
                this.cloneAttendanceList(false);
                this.onChangeClass(this.selected_class_index);
                this.isEdittingAttendance = false;
                console.log('Save successfully');
            }else {
                // this.cloneAttendanceList(true);
                // this.onChangeClass(this.selected_class_index);
                // this.isEdittingAttendance = true;
                console.log('Save failed');
            }
            this.apiResult = results.result;
            this.apiResultMessage = results.message;
            this.resultMessageModal.onOpenModal();
            this.appService.showPNotify(this.apiResult, this.apiResultMessage,this.apiResult === 'success' ? 'success' : 'error');
        }, error => {this.appService.showPNotify('failure', 'Server Error! Can\'t get save attendance', 'error'); });
    }

    public edit_attendance_reason = '';
    public current_attendance_index = 0;
    public current_attendance_detail_index = 0;
    public onAttendanceCheckClick(attendance_index: number, attendance_detail_index: number) {
        jQuery('#confirmChangeAttendanceDetailModal').modal('show');
        this.current_attendance_index = attendance_index;
        this.current_attendance_detail_index = attendance_detail_index;
    }
    public confirmChangeAttendanceDetail() {
        if (this.edit_attendance_reason === '') {
            this.appService.showPNotify('failure',"Error! Reason is required to change attendance detail",'error'); 
        }else {
            if (this.temp_attendance_lists[this.selected_class_index][this.current_attendance_index].attendance_details[this.current_attendance_detail_index].attendance_type) {
                this.temp_attendance_lists[this.selected_class_index][this.current_attendance_index].attendance_details[this.current_attendance_detail_index].attendance_type = this.appService.attendance_type.absent;
                this.temp_attendance_lists[this.selected_class_index][this.current_attendance_index].attendance_details[this.current_attendance_detail_index].icon = '';
                this.temp_attendance_lists[this.selected_class_index][this.current_attendance_index].attendance_details[this.current_attendance_detail_index].method = 'Absent';
            } else {
                this.temp_attendance_lists[this.selected_class_index][this.current_attendance_index].attendance_details[this.current_attendance_detail_index].attendance_type = this.appService.attendance_type.checklist;
                this.temp_attendance_lists[this.selected_class_index][this.current_attendance_index].attendance_details[this.current_attendance_detail_index].icon = 'fa-check';
                this.temp_attendance_lists[this.selected_class_index][this.current_attendance_index].attendance_details[this.current_attendance_detail_index].method = 'Checklist';
            }
            this.temp_attendance_lists[this.selected_class_index][this.current_attendance_index].attendance_details[this.current_attendance_detail_index].attendance_time = new Date();
            this.temp_attendance_lists[this.selected_class_index][this.current_attendance_index].attendance_details[this.current_attendance_detail_index].edited_by = this.authService.current_user.id;
            this.temp_attendance_lists[this.selected_class_index][this.current_attendance_index].attendance_details[this.current_attendance_detail_index].edited_reason = this.edit_attendance_reason;
            this.temp_attendance_lists[this.selected_class_index][this.current_attendance_index].attendance_details[this.current_attendance_detail_index].editor = this.authService.current_user.first_name + ' ' + this.authService.current_user.last_name;
            jQuery('#confirmChangeAttendanceDetailModal').modal('hide');
        }
    }

    public new_code: string = '';
    public new_name: string = '';
    public keyDownFunction(event) {
      if (event.keyCode === 13) {
        this.onAddToAttendanceList();
      }
    }
    public getSearchingStudentDetail(){
        if(this.new_code.length > 6){
            this.studentService.getStudentDetailByCode(this.new_code).subscribe(result=>{
                if(result.result == 'success'){
                    this.new_name = result.student.first_name + ' ' + result.student.last_name;
                }
                else{
                    this.new_name = '';
                }
            },error =>{console.log(error)});
        }
    }
    public onAddToAttendanceList() {
        this.attendanceService.checkAddToCourse(this.course_id, this.new_code, this.new_name).subscribe(results => {
            if (results.result === 'success') {
                var attendance = {
                    id: 0,
                    code: this.new_code,
                    name: this.new_name,
                    exemption: this.appService.attendance_status.normal,
                    attendance_details: []
                };
                for (var j = 0; j < this.temp_attendance_lists[this.selected_class_index][0].attendance_details.length; j++) {
                    var attendance_detail = {
                        attendance_id: this.attendance_lists[this.selected_class_index][0].attendance_details[j].attendance_id,
                        attendance_type: 0,
                        attendance_time: new Date(),
                        created_at: this.attendance_lists[this.selected_class_index][0].attendance_details[j].created_at,
                        edited_by: null,
                        edited_reason: null,
                        icon : '',
                        method : 'Absent'
                    };
                    attendance.attendance_details.push(attendance_detail);
                }
                this.temp_attendance_lists[this.selected_class_index].push(attendance);
                this.new_name = '';
                this.new_code = '';
            }else {
                this.apiResult = results.result;
                this.apiResultMessage = results.message;
                // this.resultMessageModal.onOpenModal();
                this.appService.showPNotify(this.apiResult, this.apiResultMessage, this.apiResult === 'success' ? 'success' : 'error');
            }
        }, error => {this.appService.showPNotify('failure', 'Server Error! Can\'t check student', 'error'); });
    }

    public delete_student_index = 0;
    public onRemoveAttendanceClick(index: number) {
        console.log('onRemoveAttendanceClick');
        jQuery('#confirmRemoveModal').modal('show');
        this.delete_student_index = index;
        console.log(this.delete_student_index);
    }

    // Function working on interface, missing query to update changes back to the database
    public onRemoveFromAttendanceList() {
        console.log('confirmRemoveAttendance');

        /*
        this.attendanceService.checkRemoveFromCourse(this.course_id, this.delete_student_index).subscribe(results => {
            if (results.result === 'success') {
                // Remove the student at delete_index
                this.temp_attendance_lists[this.selected_class_index].splice(this.delete_student_index, 1);
                console.log('Remove succesfully');
            }else {
                this.apiResult = results.result;
                this.apiResultMessage = results.message;
                // this.resultMessageModal.onOpenModal();
                this.appService.showPNotify(this.apiResult, this.apiResultMessage, this.apiResult === 'success' ? 'success' : 'error');
            }
        }, error => {this.appService.showPNotify('failure', 'Server Error! Can\'t check student', 'error'); });
        */

        // Remove the student at delete_index
        this.temp_attendance_lists[this.selected_class_index].splice(this.delete_student_index, 1);
        console.log('Remove student successfully');
    }

    public import_title;
    @ViewChild(ImportModalComponent)
    public  importModal: ImportModalComponent;
    public onCloseImport(attendance_list : any){
        if(attendance_list == 'close'){
            return;
        }
        const temp_attendance_list = this.temp_attendance_lists[this.selected_class_index];
        for(let i = 0 ; i < attendance_list.length; i++){
            let check_new_student = true;
            for(let j = 0 ; j < temp_attendance_list.length; j++){
                if(attendance_list[i].code.toString() === temp_attendance_list[j].code.toString()){
                    let length = 0;
                    if (attendance_list[i].attendance_details.length < temp_attendance_list[j].attendance_details.length){
                        length = attendance_list[i].attendance_details.length;
                    }else{
                        length = temp_attendance_list[j].attendance_details.length;
                    }
                    for (let k = 0 ; k < length; k++){
                        temp_attendance_list[j].attendance_details[k].attendance_type = attendance_list[i].attendance_details[k].attendance_type;
                        temp_attendance_list[j].attendance_details[k].attendance_time = new Date();
                        temp_attendance_list[j].attendance_details[k].icon = attendance_list[i].attendance_details[k].icon;
                        temp_attendance_list[j].attendance_details[k].method = attendance_list[i].attendance_details[k].method;
                    }
                    check_new_student = false;
                    break;
                }
            }
            if (check_new_student){
                const attendance = {
                    id: 0,
                    code: attendance_list[i].code,
                    name: attendance_list[i].name,
                    exemption : attendance_list[i].exemption,
                    attendance_details: []
                };
                if (temp_attendance_list.length > 0 && temp_attendance_list[0].attendance_details.length > 0){
                    let length = 0;
                    if (attendance_list[i].attendance_details.length < temp_attendance_list[0].attendance_details.length){
                        length = attendance_list[i].attendance_details.length;
                    }else{
                        length = temp_attendance_list[0].attendance_details.length;
                    }
                    for (let j = 0; j < length; j++) {
                        const attendance_detail = {
                            attendance_id: temp_attendance_list[0].attendance_details[j].attendance_id,
                            attendance_type: attendance_list[i].attendance_details[j].attendance_type,
                            attendance_time: new Date(),
                            created_at: temp_attendance_list[0].attendance_details[j].created_at,
                            edited_reason: null,
                            edited_by: null,
                            editor: null,
                            icon: attendance_list[i].attendance_details[j].icon,
                            method: attendance_list[i].attendance_details[j].method,
                        };
                        attendance.attendance_details.push(attendance_detail);
                    }
                }
                temp_attendance_list.push(attendance);
            }
        }
    }
    public onImportAttendanceList(){
        this.import_title = 'Load Attendance List For' + this.class_has_course[this.selected_class_index].class_name;
        this.importModal.onOpenModal();
    }

    public onExportAttendanceList(){
        let lecturers = '';
        for (let i = 0; i < this.lecturers.length; i++){
            lecturers += this.lecturers[i].first_name + ' ' + this.lecturers[i].last_name + '\r\n';
        }
        this.excelService.writeAttendanceList(
            this.attendance_list,
            this.course['code'] + ' - ' + this.course['name'] + ' - ' + this.class_has_course[this.selected_class_index].class_name + ' (' + this.course['semester_name'] + ')',
            lecturers
            );
    }
}
