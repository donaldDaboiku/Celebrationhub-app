<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMemberRequest;
use App\Http\Requests\UpdateMemberRequest;
use App\Models\Member;
use App\Services\MemberService;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function __construct(private MemberService $memberService)
    {
    }

    public function index(Request $request)
    {
        $data = $this->memberService->paginate($request->user(), $request->all());

        return ApiResponse::success($data);
    }

    public function store(StoreMemberRequest $request)
    {
        $member = $this->memberService->create(
            $request->validated(),
            $request->user()
        );

        return ApiResponse::success($member, 'Member created successfully', 201);
    }

    public function show(Request $request, Member $member)
    {
        if ($member->organization_id !== $request->user()->organization_id) {
            return ApiResponse::error('Member not found', 404);
        }

        return ApiResponse::success($member);
    }

    public function uploadPhoto(Request $request, Member $member)
    {
        if ($member->organization_id !== $request->user()->organization_id) {
            return ApiResponse::error('Member not found', 404);
        }

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $member = $this->memberService->uploadPhoto($member, $request->file('photo'));

        return ApiResponse::success($member, 'Member photo uploaded successfully');
    }

    public function removePhoto(Request $request, Member $member)
    {
        if ($member->organization_id !== $request->user()->organization_id) {
            return ApiResponse::error('Member not found', 404);
        }

        $member = $this->memberService->removePhoto($member);

        return ApiResponse::success($member, 'Member photo removed successfully');
    }

    public function update(UpdateMemberRequest $request, Member $member)
    {
        if ($member->organization_id !== $request->user()->organization_id) {
            return ApiResponse::error('Member not found', 404);
        }

        $member = $this->memberService->update($member, $request->validated());

        return ApiResponse::success($member, 'Member updated successfully');
    }

    public function destroy(Request $request, Member $member)
    {
        if ($member->organization_id !== $request->user()->organization_id) {
            return ApiResponse::error('Member not found', 404);
        }

        $this->memberService->delete($member);

        return ApiResponse::success(null, 'Member deleted successfully');
    }

    public function upcoming(Request $request)
    {
        $days = (int) $request->get('days', 7);
        $members = $this->memberService->getUpcoming($request->user(), $days);

        return ApiResponse::success($members);
    }
}
