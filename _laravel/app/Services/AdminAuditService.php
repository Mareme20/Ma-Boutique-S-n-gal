<?php
namespace App\Services;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminAuditService {
    public static function record(Request $request,string $action,?string $subjectType=null,?int $subjectId=null,array $details=[]): void {
        DB::table('admin_audit_logs')->insert(['admin_user_id'=>$request->attributes->get('admin_user')?->id,'action'=>$action,
            'subject_type'=>$subjectType,'subject_id'=>$subjectId,'details'=>json_encode($details,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),
            'ip_address'=>$request->ip(),'created_at'=>now()]);
    }
}
