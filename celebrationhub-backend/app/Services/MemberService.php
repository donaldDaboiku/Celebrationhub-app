<?php

namespace App\Services;

use App\Models\Member;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class MemberService
{
    public function paginate(User $user, array $filters = []): array
    {
        $perPage = (int) ($filters['limit'] ?? 20);
        $search = $filters['search'] ?? null;
        $active = $filters['active'] ?? null;
        $approved = $filters['approved'] ?? null;

        $query = Member::where('organization_id', $user->organization_id);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($active !== null) {
            $query->where('active', filter_var($active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($approved !== null) {
            $query->where('approved', filter_var($approved, FILTER_VALIDATE_BOOLEAN));
        }

        $members = $query->latest()->paginate($perPage);

        return [
            'members' => $members->items(),
            'pagination' => $this->paginationMeta($members),
        ];
    }

    public function getUpcoming(User $user, int $days = 7)
    {
        return Member::where('organization_id', $user->organization_id)
            ->active()
            ->approved()
            ->upcomingBirthdays($days)
            ->get();
    }

    public function findForOrganization(int $memberId, User $user): ?Member
    {
        return Member::where('organization_id', $user->organization_id)
            ->where('id', $memberId)
            ->first();
    }

    public function create(array $data, User $user): Member
    {
        $data['organization_id'] = $user->organization_id;

        return Member::create($data);
    }

    public function update(Member $member, array $data): Member
    {
        $member->update($data);

        return $member->fresh();
    }

    public function delete(Member $member): void
    {
        $member->delete();
    }

    public function uploadPhoto(Member $member, UploadedFile $file): Member
    {
        if (! is_dir(public_path('member-photos'))) {
            mkdir(public_path('member-photos'), 0755, true);
        }

        $this->deletePhotoFile($member);

        $filename = 'member-' . $member->id . '-' . Str::lower(Str::random(10)) . '.' . $file->getClientOriginalExtension();
        $file->move(public_path('member-photos'), $filename);

        $member->photo_url = asset('member-photos/' . $filename);
        $member->save();

        return $member->fresh();
    }

    public function removePhoto(Member $member): Member
    {
        $this->deletePhotoFile($member);

        $member->photo_url = null;
        $member->save();

        return $member->fresh();
    }

    private function deletePhotoFile(Member $member): void
    {
        if (! $member->photo_url) {
            return;
        }

        $oldPath = parse_url($member->photo_url, PHP_URL_PATH);
        $oldAbsolutePath = $oldPath ? public_path(ltrim($oldPath, '/')) : null;

        if ($oldAbsolutePath && str_starts_with($oldAbsolutePath, public_path('member-photos')) && file_exists($oldAbsolutePath)) {
            unlink($oldAbsolutePath);
        }
    }

    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
        ];
    }
}
