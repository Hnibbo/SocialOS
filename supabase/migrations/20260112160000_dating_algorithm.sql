-- Create Hyper-Matching RPC
CREATE OR REPLACE FUNCTION find_best_matches(
  p_latitude float,
  p_longitude float,
  p_radius_meters float DEFAULT 50000,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  username text,
  avatar_url text,
  age int,
  bio text,
  match_score float,
  distance_meters float,
  shared_interests text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_interests text[];
BEGIN
  -- Get current user interests
  SELECT interests INTO current_user_interests
  FROM dating_profiles
  WHERE user_id = auth.uid();

  RETURN QUERY
  SELECT
    dp.user_id,
    up.full_name,
    up.username,
    up.avatar_url,
    dp.age,
    dp.bio,
    (
      -- Scoring Algorithm
      (100 * (1 - (st_distance(
        st_point(p_longitude, p_latitude)::geography, 
        st_point(dp.location_lng, dp.location_lat)::geography
      ) / p_radius_meters))) + -- Distance weight (0-100)
      
      (cardinality(array_intersect(dp.interests, current_user_interests)) * 10) + -- Interest weight (10 pts per match)
      
      (CASE WHEN dp.is_verified THEN 20 ELSE 0 END) -- Verification bonus
    )::float as match_score,
    
    st_distance(
      st_point(p_longitude, p_latitude)::geography, 
      st_point(dp.location_lng, dp.location_lat)::geography
    ) as distance_meters,
    
    array_intersect(dp.interests, current_user_interests) as shared_interests
    
  FROM dating_profiles dp
  JOIN user_profiles up ON dp.user_id = up.id
  WHERE
    dp.user_id != auth.uid()
    AND dp.is_visible = true
    AND st_dwithin(
      st_point(dp.location_lng, dp.location_lat)::geography,
      st_point(p_longitude, p_latitude)::geography,
      p_radius_meters
    )
    AND NOT EXISTS ( -- Exclude previously swiped
      SELECT 1 FROM dating_swipes ds 
      WHERE ds.swiper_id = auth.uid() AND ds.swiped_id = dp.user_id
    )
  ORDER BY match_score DESC
  LIMIT p_limit;
END;
$$;

-- Helper for array intersection
CREATE OR REPLACE FUNCTION array_intersect(anyarray, anyarray)
RETURNS anyarray language sql
as $$
    SELECT ARRAY(
        SELECT UNNEST($1)
        INTERSECT
        SELECT UNNEST($2)
    );
$$;
