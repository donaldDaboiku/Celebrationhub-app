<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Member;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    /**
     * Display a listing of members
     */
    public function index(Request $request)
    {
        $perPage = $request->get('limit', 20);
        $search = $request->get('search');
        $active = $request->get('active');
        $approved = $request->get('approved');

        $query = Member::where('organization_id', $request->user()->organization_id);

        // Search
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($active !== null) {
            $query->where('active', filter_var($active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($approved !== null) {
            $query->where('approved', filter_var($approved, FILTER_VALIDATE_BOOLEAN));
        }

        $members = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'members' => $members->items(),
                'pagination' => [
                    'total' => $members->total(),
                    'per_page' => $members->perPage(),
                    'current_page' => $members->currentPage(),
                    'last_page' => $members->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * Store a newly created member
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:50',
            'first_name' => 'required|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'birthday' => 'nullable|date',
            'anniversary' => 'nullable|date',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'photo_url' => 'nullable|url',
            'tags' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $member = Member::create([
            ...$validated,
            'organization_id' => $request->user()->organization_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Member created successfully',
            'data' => $member,
        ], 201);
    }

    /**
     * Display the specified member
     */
    public function show(Request $request, Member $member)
    {
        // Check if member belongs to user's organization
        if ($member->organization_id !== $request->user()->organization_id) {
            return response()->json([
                'success' => false,
                'message' => 'Member not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $member,
        ]);
    }

    /**
     * Update the specified member
     */
    public function update(Request $request, Member $member)
    {
        // Check if member belongs to user's organization
        if ($member->organization_id !== $request->user()->organization_id) {
            return response()->json([
                'success' => false,
                'message' => 'Member not found',
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:50',
            'first_name' => 'sometimes|required|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'birthday' => 'nullable|date',
            'anniversary' => 'nullable|date',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'photo_url' => 'nullable|url',
            'active' => 'nullable|boolean',
            'approved' => 'nullable|boolean',
            'tags' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $member->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Member updated successfully',
            'data' => $member->fresh(),
        ]);
    }

    /**
     * Remove the specified member
     */
    public function destroy(Request $request, Member $member)
    {
        // Check if member belongs to user's organization
        if ($member->organization_id !== $request->user()->organization_id) {
            return response()->json([
                'success' => false,
                'message' => 'Member not found',
            ], 404);
        }

        $member->delete();

        return response()->json([
            'success' => true,
            'message' => 'Member deleted successfully',
        ]);
    }

    /**
     * Get upcoming celebrations
     */
    public function upcoming(Request $request)
    {
        $days = $request->get('days', 7);

        $members = Member::where('organization_id', $request->user()->organization_id)
            ->active()
            ->approved()
            ->upcomingBirthdays($days)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $members,
        ]);
    }
}